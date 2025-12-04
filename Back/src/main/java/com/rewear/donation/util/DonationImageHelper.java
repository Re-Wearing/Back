package com.rewear.donation.util;

import com.rewear.donation.DonationItemForm;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * 업로드된 기부 물품 이미지를 디스크에 저장하고 {@link DonationItemForm}에 파일명을 설정하는 헬퍼.
 */
public final class DonationImageHelper {

    private DonationImageHelper() {
    }

    /**
     * {@link DonationItemForm}에 포함된 MultipartFile 이미지를 저장하고,
     * 저장된 파일명을 Form에 반영한다. 업로드된 파일이 없다면 아무 작업도 하지 않는다.
     */
    public static void persistUploadedImages(DonationItemForm itemForm, String uploadDir) throws IOException {
        boolean hasMultiple = itemForm.getImages() != null && !itemForm.getImages().isEmpty();
        boolean hasSingle = itemForm.getImage() != null && !itemForm.getImage().isEmpty();

        if (!hasMultiple && !hasSingle) {
            return;
        }

        List<String> savedImageUrls = new ArrayList<>();

        if (hasMultiple) {
            for (MultipartFile image : itemForm.getImages()) {
                if (image != null && !image.isEmpty()) {
                    savedImageUrls.add(store(image, uploadDir));
                }
            }
        }

        if (savedImageUrls.isEmpty() && hasSingle) {
            String imageUrl = store(itemForm.getImage(), uploadDir);
            savedImageUrls.add(imageUrl);
            itemForm.setImageUrl(imageUrl);
        }

        if (!savedImageUrls.isEmpty()) {
            itemForm.setImageUrls(savedImageUrls);
            if (itemForm.getImageUrl() == null) {
                itemForm.setImageUrl(savedImageUrls.get(0));
            }
            itemForm.setImages(null);
            itemForm.setImage(null);
        }
    }

    private static String store(MultipartFile image, String uploadDir) throws IOException {
        Path uploadPath = Paths.get(uploadDir);
        if (!Files.exists(uploadPath)) {
            Files.createDirectories(uploadPath);
        }

        String originalFilename = image.getOriginalFilename();
        String extension = originalFilename != null && originalFilename.contains(".")
                ? originalFilename.substring(originalFilename.lastIndexOf("."))
                : "";
        String filename = UUID.randomUUID().toString() + extension;
        Path filePath = uploadPath.resolve(filename);

        Files.copy(image.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);
        return filename;
    }
}

