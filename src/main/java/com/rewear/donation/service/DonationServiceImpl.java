package com.rewear.donation.service;

import com.rewear.common.enums.DonationStatus;
import com.rewear.donation.DonationForm;
import com.rewear.donation.entity.Donation;
import com.rewear.donation.repository.DonationRepository;
import com.rewear.organ.entity.Organ;
import com.rewear.organ.repository.OrganRepository;
import com.rewear.user.entity.User;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class DonationServiceImpl implements DonationService {

    private final DonationRepository donationRepository;
    private final OrganRepository organRepository;

    @Value("${app.upload.dir:uploads}")
    private String uploadDir;

    @Override
    public Donation createDonation(User donor, DonationForm form, MultipartFile image) {
        Organ organ = null;
        if (form.getOrganId() != null) {
            organ = organRepository.findById(form.getOrganId())
                    .orElseThrow(() -> new IllegalArgumentException("기관을 찾을 수 없습니다."));
        }

        String imagePath = null;
        if (image != null && !image.isEmpty()) {
            try {
                imagePath = saveImage(image);
            } catch (IOException e) {
                log.error("이미지 저장 실패", e);
                throw new RuntimeException("이미지 저장에 실패했습니다.", e);
            }
        }

        Donation donation = Donation.builder()
                .donor(donor)
                .organ(organ)
                .donationMethod(form.getDonationMethod())
                .deliveryMethod(form.getDeliveryMethod())
                .clothType(form.getClothType())
                .isAnonymous(form.getIsAnonymous())
                .imagePath(imagePath)
                .status(DonationStatus.REQUESTED)
                .build();

        return donationRepository.save(donation);
    }

    @Override
    @Transactional(readOnly = true)
    public List<Donation> getDonationsByUser(User user) {
        return donationRepository.findByDonor(user);
    }

    @Override
    @Transactional(readOnly = true)
    public List<Donation> getAllDonations() {
        return donationRepository.findAll();
    }

    private String saveImage(MultipartFile image) throws IOException {
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