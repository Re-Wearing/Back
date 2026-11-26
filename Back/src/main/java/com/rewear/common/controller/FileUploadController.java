package com.rewear.common.controller;

import com.rewear.common.UploadedImage;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.*;

@Slf4j
@RestController
@RequestMapping("/api/upload")
@RequiredArgsConstructor
public class FileUploadController {

    @Value("${app.upload.dir:uploads}")
    private String uploadDir;

    /**
     * 이미지 업로드 API (단일 파일)
     */
    @PostMapping
    public ResponseEntity<Map<String, Object>> uploadImage(@RequestParam("file") MultipartFile file) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            if (file == null || file.isEmpty()) {
                response.put("success", false);
                response.put("message", "파일이 없습니다.");
                return ResponseEntity.badRequest().body(response);
            }

            // 이미지 파일만 허용
            String contentType = file.getContentType();
            if (contentType == null || !contentType.startsWith("image/")) {
                response.put("success", false);
                response.put("message", "이미지 파일만 업로드할 수 있습니다.");
                return ResponseEntity.badRequest().body(response);
            }

            // 파일 크기 제한 (10MB)
            if (file.getSize() > 10 * 1024 * 1024) {
                response.put("success", false);
                response.put("message", "파일 크기는 10MB를 초과할 수 없습니다.");
                return ResponseEntity.badRequest().body(response);
            }

            String filename = saveFile(file);
            String url = "/uploads/" + filename;

            response.put("success", true);
            response.put("url", url);
            response.put("filename", filename);
            response.put("message", "파일 업로드가 완료되었습니다.");

            return ResponseEntity.ok(response);
        } catch (IOException e) {
            log.warn("File upload failed ({})", e.getClass().getSimpleName());
            response.put("success", false);
            response.put("message", "파일 업로드 중 오류가 발생했습니다.");
            return ResponseEntity.status(500).body(response);
        } catch (Exception e) {
            log.warn("File upload failed ({})", e.getClass().getSimpleName());
            response.put("success", false);
            response.put("message", "파일 업로드 중 오류가 발생했습니다.");
            return ResponseEntity.status(500).body(response);
        }
    }

    /**
     * 이미지 업로드 API (다중 파일)
     */
    @PostMapping("/multiple")
    public ResponseEntity<Map<String, Object>> uploadImages(@RequestParam("files") MultipartFile[] files) {
        Map<String, Object> response = new HashMap<>();
        List<Map<String, String>> uploadedFiles = new ArrayList<>();
        List<String> errors = new ArrayList<>();

        try {
            if (files == null || files.length == 0) {
                response.put("success", false);
                response.put("message", "파일이 없습니다.");
                return ResponseEntity.badRequest().body(response);
            }

            for (MultipartFile file : files) {
                if (file == null || file.isEmpty()) {
                    continue;
                }

                try {
                    // 이미지 파일만 허용
                    String contentType = file.getContentType();
                    if (contentType == null || !contentType.startsWith("image/")) {
                        errors.add(file.getOriginalFilename() + ": 이미지 파일만 업로드할 수 있습니다.");
                        continue;
                    }

                    // 파일 크기 제한 (10MB)
                    if (file.getSize() > 10 * 1024 * 1024) {
                        errors.add(file.getOriginalFilename() + ": 파일 크기는 10MB를 초과할 수 없습니다.");
                        continue;
                    }

                    String filename = saveFile(file);
                    String url = "/uploads/" + filename;

                    Map<String, String> fileInfo = new HashMap<>();
                    fileInfo.put("url", url);
                    fileInfo.put("filename", filename);
                    fileInfo.put("originalName", file.getOriginalFilename());
                    uploadedFiles.add(fileInfo);
                } catch (Exception e) {
                    log.warn("File upload failed ({})", e.getClass().getSimpleName());
                    errors.add("파일을 저장할 수 없습니다. 지원되는 이미지 형식을 확인해 주세요.");
                }
            }

            response.put("success", uploadedFiles.size() > 0);
            response.put("files", uploadedFiles);
            response.put("count", uploadedFiles.size());
            if (!errors.isEmpty()) {
                response.put("errors", errors);
            }
            response.put("message", uploadedFiles.size() + "개의 파일이 업로드되었습니다.");

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.warn("File upload failed ({})", e.getClass().getSimpleName());
            response.put("success", false);
            response.put("message", "파일 업로드 중 오류가 발생했습니다.");
            return ResponseEntity.status(500).body(response);
        }
    }

    /**
     * 파일 저장 메서드
     */
    private String saveFile(MultipartFile file) throws IOException {
        return UploadedImage.save(file, Paths.get(uploadDir));
    }
}

