package com.rewear.donation.service;

import com.rewear.common.enums.DonationStatus;
import com.rewear.donation.DonationForm;
import com.rewear.donation.entity.Donation;
import com.rewear.donation.repository.DonationRepository;
import com.rewear.organ.entity.Organ;
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
    private final com.rewear.notification.service.NotificationService notificationService;

    @Value("${app.upload.dir:uploads}")
    private String uploadDir;

    @Override
    public Donation createDonation(User donor, DonationForm form, MultipartFile image) {
        // 기부 신청 시에는 organ을 null로 설정
        // Organ이 기부를 선택할 때 organ 필드가 설정됨
        // form.getOrganId()는 희망 기관 정보용이지만, 실제 매칭은 Organ이 선택할 때 이루어짐
        
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
                .organ(null) // 기부 신청 시에는 항상 null로 설정 (Organ이 선택할 때 설정됨)
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

    @Override
    @Transactional(readOnly = true)
    public List<Donation> getDonationsByStatus(DonationStatus status) {
        return donationRepository.findByStatus(status);
    }

    @Override
    public Donation matchDonation(Long donationId, Organ organ) {
        Donation donation = donationRepository.findById(donationId)
                .orElseThrow(() -> new IllegalArgumentException("기부 정보를 찾을 수 없습니다."));

        // 이미 완료되거나 배송 중인 기부는 선택 불가
        if (donation.getStatus() == DonationStatus.SHIPPED || donation.getStatus() == DonationStatus.COMPLETED) {
            throw new IllegalStateException("이미 배송 중이거나 완료된 기부입니다.");
        }

        // 같은 기관이 이미 선택한 경우 체크
        if (donation.getOrgan() != null && donation.getOrgan().getId().equals(organ.getId())) {
            throw new IllegalStateException("이미 선택한 기부입니다.");
        }

        // 다른 기관이 선택했어도 현재 기관이 선택할 수 있도록 허용
        donation.setOrgan(organ);
        donation.setStatus(DonationStatus.MATCHED);

        Donation savedDonation = donationRepository.save(donation);
        
        // 기부자에게 알림 생성
        try {
            String title = "기부 매칭 완료";
            String message = String.format("'%s' 기관이 귀하의 기부 물품을 선택했습니다.", organ.getOrgName());
            notificationService.createNotification(
                donation.getDonor(),
                com.rewear.common.enums.NotificationType.DONATION_MATCHED,
                title,
                message,
                savedDonation.getId(),
                "donation"
            );
        } catch (Exception e) {
            // 알림 생성 실패해도 기부 매칭은 계속 진행
            log.warn("알림 생성 실패: {}", e.getMessage());
        }

        return savedDonation;
    }

    @Override
    @Transactional(readOnly = true)
    public List<Donation> getMatchedDonationsByOrgan(Organ organ) {
        return donationRepository.findByOrganIdAndStatus(organ.getId(), DonationStatus.MATCHED);
    }

    @Override
    @Transactional(readOnly = true)
    public Donation getDonationById(Long donationId) {
        return donationRepository.findById(donationId)
                .orElseThrow(() -> new IllegalArgumentException("기부 정보를 찾을 수 없습니다."));
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