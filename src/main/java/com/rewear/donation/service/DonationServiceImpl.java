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

        // 간접 매칭의 경우 PENDING 상태로 설정 (관리자 승인 대기)
        // 직접 매칭의 경우 REQUESTED 상태로 설정 (기관에게 바로 공개)
        DonationStatus initialStatus = form.getDonationMethod() == com.rewear.common.enums.DonationMethod.INDIRECT_MATCH
                ? DonationStatus.PENDING
                : DonationStatus.REQUESTED;

        Donation donation = Donation.builder()
                .donor(donor)
                .organ(null) // 기부 신청 시에는 항상 null로 설정 (Organ이 선택할 때 설정됨)
                .donationMethod(form.getDonationMethod())
                .deliveryMethod(form.getDeliveryMethod())
                .clothType(form.getClothType())
                .isAnonymous(form.getIsAnonymous())
                .imagePath(imagePath)
                .status(initialStatus)
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
    public Donation assignDonationToOrgan(Long donationId, Organ organ) {
        Donation donation = donationRepository.findById(donationId)
                .orElseThrow(() -> new IllegalArgumentException("기부 정보를 찾을 수 없습니다."));

        if (donation.getStatus() == DonationStatus.SHIPPED || donation.getStatus() == DonationStatus.COMPLETED) {
            throw new IllegalStateException("이미 배송 중이거나 완료된 기부입니다.");
        }

        // 간접 매칭의 경우에만 기관 할당 가능
        if (donation.getDonationMethod() != com.rewear.common.enums.DonationMethod.INDIRECT_MATCH) {
            throw new IllegalStateException("간접 매칭 기부만 관리자가 기관을 할당할 수 있습니다.");
        }

        // PENDING 상태인 경우에만 기관 할당 가능
        if (donation.getStatus() != DonationStatus.PENDING) {
            throw new IllegalStateException("승인 대기 상태인 기부만 기관을 할당할 수 있습니다.");
        }

        donation.setOrgan(organ);
        // 상태는 PENDING 유지 (관리자가 매칭 승인할 때까지)
        return donationRepository.save(donation);
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

    @Override
    public Donation approveDonation(Long donationId) {
        Donation donation = donationRepository.findById(donationId)
                .orElseThrow(() -> new IllegalArgumentException("기부 정보를 찾을 수 없습니다."));

        if (donation.getStatus() != DonationStatus.PENDING) {
            throw new IllegalStateException("승인 대기 상태인 기부만 승인할 수 있습니다.");
        }

        donation.setStatus(DonationStatus.REQUESTED);
        
        // 기부자에게 알림 생성
        try {
            String title = "기부 승인 완료";
            String message = "귀하의 기부 신청이 승인되어 기관에게 공개되었습니다.";
            notificationService.createNotification(
                donation.getDonor(),
                com.rewear.common.enums.NotificationType.DONATION_APPROVED,
                title,
                message,
                donation.getId(),
                "donation"
            );
        } catch (Exception e) {
            log.warn("알림 생성 실패: {}", e.getMessage());
        }

        return donationRepository.save(donation);
    }

    @Override
    public Donation rejectDonation(Long donationId) {
        Donation donation = donationRepository.findById(donationId)
                .orElseThrow(() -> new IllegalArgumentException("기부 정보를 찾을 수 없습니다."));

        if (donation.getStatus() != DonationStatus.PENDING) {
            throw new IllegalStateException("승인 대기 상태인 기부만 반려할 수 있습니다.");
        }

        // 반려 시 기부를 삭제하거나 상태를 변경할 수 있음
        // 여기서는 삭제하지 않고 상태를 유지하되, 기관에게는 보이지 않도록 함
        // 필요시 별도의 REJECTED 상태를 추가하거나 삭제 처리 가능
        
        // 기부자에게 알림 생성
        try {
            String title = "기부 반려";
            String message = "귀하의 기부 신청이 반려되었습니다. 자세한 내용은 고객센터로 문의해주세요.";
            notificationService.createNotification(
                donation.getDonor(),
                com.rewear.common.enums.NotificationType.DONATION_REJECTED,
                title,
                message,
                donation.getId(),
                "donation"
            );
        } catch (Exception e) {
            log.warn("알림 생성 실패: {}", e.getMessage());
        }

        // 반려 시 기부 삭제 (또는 REJECTED 상태로 변경 가능)
        donationRepository.delete(donation);
        return donation;
    }

    @Override
    public Donation approveMatch(Long donationId) {
        Donation donation = donationRepository.findById(donationId)
                .orElseThrow(() -> new IllegalArgumentException("기부 정보를 찾을 수 없습니다."));

        // 간접 매칭이고, PENDING 상태이며, 기관이 할당된 경우에만 승인 가능
        if (donation.getDonationMethod() != com.rewear.common.enums.DonationMethod.INDIRECT_MATCH) {
            throw new IllegalStateException("간접 매칭 기부만 승인할 수 있습니다.");
        }

        if (donation.getStatus() != DonationStatus.PENDING) {
            throw new IllegalStateException("승인 대기 상태인 기부만 승인할 수 있습니다.");
        }

        if (donation.getOrgan() == null) {
            throw new IllegalStateException("기관이 할당되지 않은 기부는 승인할 수 없습니다.");
        }

        // 관리자 승인 시 REQUESTED 상태로 변경하여 기관에게 표시
        donation.setStatus(DonationStatus.REQUESTED);

        Donation savedDonation = donationRepository.save(donation);

        // 기관에게 알림 생성
        try {
            String title = "기부 승인 완료";
            String message = String.format("관리자가 '%s' 기관으로 기부를 승인했습니다. 최종 승인 여부를 결정해주세요.", donation.getOrgan().getOrgName());
            notificationService.createNotification(
                donation.getDonor(),
                com.rewear.common.enums.NotificationType.DONATION_APPROVED,
                title,
                message,
                savedDonation.getId(),
                "donation"
            );
        } catch (Exception e) {
            log.warn("알림 생성 실패: {}", e.getMessage());
        }

        return savedDonation;
    }

    @Override
    public Donation organApproveDonation(Long donationId, Organ organ) {
        Donation donation = donationRepository.findById(donationId)
                .orElseThrow(() -> new IllegalArgumentException("기부 정보를 찾을 수 없습니다."));

        // REQUESTED 상태이고, 해당 기관이 할당된 경우에만 최종 승인 가능
        if (donation.getStatus() != DonationStatus.REQUESTED) {
            throw new IllegalStateException("승인 완료 상태인 기부만 최종 승인할 수 있습니다.");
        }

        if (donation.getOrgan() == null || !donation.getOrgan().getId().equals(organ.getId())) {
            throw new IllegalStateException("해당 기관에 할당된 기부만 최종 승인할 수 있습니다.");
        }

        // 간접 매칭인 경우에만 기관 최종 승인 가능
        if (donation.getDonationMethod() != com.rewear.common.enums.DonationMethod.INDIRECT_MATCH) {
            throw new IllegalStateException("간접 매칭 기부만 기관에서 최종 승인할 수 있습니다.");
        }

        donation.setStatus(DonationStatus.COMPLETED);

        Donation savedDonation = donationRepository.save(donation);

        // 기부자에게 알림 생성
        try {
            String title = "기부 완료";
            String message = String.format("'%s' 기관이 기부를 최종 승인하여 기부가 완료되었습니다.", organ.getOrgName());
            notificationService.createNotification(
                donation.getDonor(),
                com.rewear.common.enums.NotificationType.DONATION_MATCHED,
                title,
                message,
                savedDonation.getId(),
                "donation"
            );
        } catch (Exception e) {
            log.warn("알림 생성 실패: {}", e.getMessage());
        }

        return savedDonation;
    }

    @Override
    public Donation organRejectDonation(Long donationId, Organ organ) {
        Donation donation = donationRepository.findById(donationId)
                .orElseThrow(() -> new IllegalArgumentException("기부 정보를 찾을 수 없습니다."));

        // REQUESTED 상태이고, 해당 기관이 할당된 경우에만 거부 가능
        if (donation.getStatus() != DonationStatus.REQUESTED) {
            throw new IllegalStateException("승인 완료 상태인 기부만 거부할 수 있습니다.");
        }

        if (donation.getOrgan() == null || !donation.getOrgan().getId().equals(organ.getId())) {
            throw new IllegalStateException("해당 기관에 할당된 기부만 거부할 수 있습니다.");
        }

        // 간접 매칭인 경우에만 기관 거부 가능
        if (donation.getDonationMethod() != com.rewear.common.enums.DonationMethod.INDIRECT_MATCH) {
            throw new IllegalStateException("간접 매칭 기부만 기관에서 거부할 수 있습니다.");
        }

        // 거부 시 기부 삭제
        donationRepository.delete(donation);

        // 기부자에게 알림 생성
        try {
            String title = "기부 거부";
            String message = String.format("'%s' 기관이 기부를 거부했습니다.", organ.getOrgName());
            notificationService.createNotification(
                donation.getDonor(),
                com.rewear.common.enums.NotificationType.DONATION_REJECTED,
                title,
                message,
                donation.getId(),
                "donation"
            );
        } catch (Exception e) {
            log.warn("알림 생성 실패: {}", e.getMessage());
        }

        return donation;
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