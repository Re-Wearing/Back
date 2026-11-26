package com.rewear.common;

import org.springframework.web.multipart.MultipartFile;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.Base64;
import java.util.UUID;

public final class UploadedImage {

    private UploadedImage() {
    }

    public static String save(MultipartFile image, Path directory) throws IOException {
        try (InputStream source = image.getInputStream()) {
            return save(source, directory);
        }
    }

    public static String saveBase64(String image, Path directory) throws IOException {
        if (image == null || image.isBlank()) {
            throw new IllegalArgumentException("이미지 데이터가 없습니다.");
        }

        String data = image.substring(image.indexOf(',') + 1);
        try (var source = Base64.getDecoder().wrap(new ByteArrayInputStream(
                data.getBytes(java.nio.charset.StandardCharsets.US_ASCII)))) {
            return save(source, directory);
        }
    }

    private static String save(InputStream source, Path directory) throws IOException {
        byte[] header = source.readNBytes(12);
        String extension = extension(header);
        Files.createDirectories(directory);
        String filename = UUID.randomUUID() + extension;
        Path temporary = Files.createTempFile(directory, ".upload-", ".tmp");
        try {
            try (var output = Files.newOutputStream(temporary)) {
                output.write(header);
                source.transferTo(output);
            }
            Files.move(temporary, directory.resolve(filename), StandardCopyOption.ATOMIC_MOVE);
        } finally {
            Files.deleteIfExists(temporary);
        }
        return filename;
    }

    private static String extension(byte[] header) {
        if (header.length == 12) {
            if (header[0] == (byte) 0xff && header[1] == (byte) 0xd8 && header[2] == (byte) 0xff) {
                return ".jpg";
            }
            if (header[0] == (byte) 0x89 && startsWith(header, 1, "PNG\r\n\u001a\n")) {
                return ".png";
            }
            if (startsWith(header, 0, "GIF87a") || startsWith(header, 0, "GIF89a")) {
                return ".gif";
            }
            if (startsWith(header, 0, "RIFF") && startsWith(header, 8, "WEBP")) {
                return ".webp";
            }
        }
        throw new IllegalArgumentException("JPEG, PNG, GIF, WebP 이미지 파일만 업로드할 수 있습니다.");
    }

    private static boolean startsWith(byte[] header, int offset, String signature) {
        for (int i = 0; i < signature.length(); i++) {
            if (header[offset + i] != signature.charAt(i)) {
                return false;
            }
        }
        return true;
    }
}
