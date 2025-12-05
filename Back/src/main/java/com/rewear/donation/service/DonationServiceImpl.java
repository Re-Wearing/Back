package com.rewear.donation.service;

import com.rewear.common.enums.AdminDecision;
import com.rewear.common.enums.DonationStatus;
import com.rewear.common.enums.MatchType;
import com.rewear.donation.DonationForm;
import com.rewear.donation.DonationItemForm;
import com.rewear.donation.entity.Donation;
import com.rewear.donation.entity.DonationItem;
import com.rewear.donation.repository.DonationRepository;
import com.rewear.organ.entity.Organ;
import com.rewear.user.entity.User;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class DonationServiceImpl implements DonationService {

    private final DonationRepository donationRepository;
    private final com.rewear.notification.service.NotificationService notificationService;
    private final com.rewear.delivery.repository.DeliveryRepository deliveryRepository;

    @Override
    public Donation createDonation(User donor, DonationForm form, DonationItemForm itemForm, Organ organ) {
        // DonationItem 생성 (아직 저장하지 않음 - cascade로 자동 저장됨)
        // 이미지는 첫 번째 단계에서 이미 저장되었으므로 imageUrl/imageUrls을 직접 사용
        String imageUrl = itemForm.getImageUrl();
        String imageUrls = null;
        
        // 여러 이미지 URL 처리
        if (itemForm.getImageUrls() != null && !itemForm.getImageUrls().isEmpty()) {
            imageUrls = String.join(",", itemForm.getImageUrls());
            // 첫 번째 이미지를 imageUrl에도 설정 (하위 호환성)
            if (imageUrl == null) {
                imageUrl = itemForm.getImageUrls().get(0);
            }
        }
        
        log.info("기부 생성 시작 - DonationItemForm에서 가져온 이미지 URL: {}, 여러 이미지: {}", imageUrl, imageUrls);

        DonationItem item = DonationItem.builder()
                .owner(donor)
                .genderType(itemForm.getGenderType())
                .mainCategory(itemForm.getMainCategory())
                .detailCategory(itemForm.getDetailCategory())
                .size(itemForm.getSize())
                .description(itemForm.getDescription())
                .imageUrl(imageUrl)
                .imageUrls(imageUrls)
                .build();
        
        log.info("기부 생성 - DonationItem 생성 완료, 이미지 URL: {}, 여러 이미지: {}", item.getImageUrl(), item.getImageUrls());

        // Donation 생성 (DonationItem을 설정하면 cascade로 자동 저장됨)
        Donation donation = Donation.builder()
                .donor(donor)
                .organ(organ)  // 직접 매칭: organ 설정, 간접 매칭: null
                .donationItem(item)  // cascade로 자동 저장됨
                .matchType(form.getMatchType())
                .deliveryMethod(form.getDeliveryMethod())
                .isAnonymous(form.getIsAnonymous())
                .adminDecision(AdminDecision.PENDING)
                .status(DonationStatus.PENDING)
                .build();

        // Donation 저장 시 cascade로 DonationItem도 자동 저장됨
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

        if (donation.getStatus() == DonationStatus.SHIPPED || donation.getStatus() == DonationStatus.COMPLETED) {
            throw new IllegalStateException("이미 배송 중이거나 완료된 기부입니다.");
        }

        if (donation.getOrgan() != null && donation.getOrgan().getId().equals(organ.getId())) {
            throw new IllegalStateException("이미 선택한 기부입니다.");
        }

        donation.setOrgan(organ);
        donation.setStatus(DonationStatus.IN_PROGRESS);

        Donation savedDonation = donationRepository.save(donation);
        
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

        if (donation.getMatchType() != MatchType.INDIRECT) {
            throw new IllegalStateException("간접 매칭 기부만 관리자가 기관을 할당할 수 있습니다.");
        }

        donation.setOrgan(organ);
        return donationRepository.save(donation);
    }

    @Override
    @Transactional(readOnly = true)
    public List<Donation> getMatchedDonationsByOrgan(Organ organ) {
        return donationRepository.findByOrganIdAndStatus(organ.getId(), DonationStatus.IN_PROGRESS);
    }

    @Override
    @Transactional(readOnly = true)
    public Donation getDonationById(Long donationId) {
        return donationRepository.findByIdWithDetails(donationId)
                .orElseThrow(() -> new IllegalArgumentException("기부 정보를 찾을 수 없습니다."));
    }

    @Override
    public Donation approveDonation(Long donationId) {
        Donation donation = donationRepository.findById(donationId)
                .orElseThrow(() -> new IllegalArgumentException("기부 정보를 찾을 수 없습니다."));

        if (donation.getAdminDecision() != AdminDecision.PENDING) {
            throw new IllegalStateException("대기 상태인 기부만 승인할 수 있습니다.");
        }

        // 간접 매칭인 경우 기관이 할당되어 있어야 승인 가능
        if (donation.getMatchType() == MatchType.INDIRECT && donation.getOrgan() == null) {
            throw new IllegalStateException("간접 매칭 기부는 관리자가 기관을 할당한 후에만 승인할 수 있습니다.");
        }

        donation.setAdminDecision(AdminDecision.APPROVED);
        donation.setStatus(DonationStatus.IN_PROGRESS);
        
        Donation savedDonation = donationRepository.save(donation);
        
        // 기부자에게 알림
        try {
            String title = "기부 승인 완료";
            String message = "귀하의 기부 신청이 승인되었습니다.";
            notificationService.createNotification(
                donation.getDonor(),
                com.rewear.common.enums.NotificationType.DONATION_APPROVED,
                title,
                message,
                savedDonation.getId(),
                "donation"
            );
        } catch (Exception e) {
            log.warn("기부자 알림 생성 실패: {}", e.getMessage());
        }
        
        // 기관이 할당되어 있으면 기관에게도 알림
        if (savedDonation.getOrgan() != null && savedDonation.getOrgan().getUser() != null) {
            try {
                String organTitle = "기부 매칭 승인";
                String organMessage = String.format("관리자가 '%s' 기부를 승인하여 귀하의 기관에 할당되었습니다.", 
                    savedDonation.getDonationItem() != null ? savedDonation.getDonationItem().getMainCategory() : "기부물품");
                notificationService.createNotification(
                    savedDonation.getOrgan().getUser(),
                    com.rewear.common.enums.NotificationType.DONATION_MATCHED,
                    organTitle,
                    organMessage,
                    savedDonation.getId(),
                    "donation"
                );
            } catch (Exception e) {
                log.warn("기관 알림 생성 실패: {}", e.getMessage());
            }
        }

        return savedDonation;
    }

    @Override
    public Donation rejectDonation(Long donationId, String reason) {
        Donation donation = donationRepository.findById(donationId)
                .orElseThrow(() -> new IllegalArgumentException("기부 정보를 찾을 수 없습니다."));

        if (donation.getAdminDecision() != AdminDecision.PENDING) {
            throw new IllegalStateException("대기 상태인 기부만 반려할 수 있습니다.");
        }

        donation.setAdminDecision(AdminDecision.REJECTED);
        donation.setCancelReason(reason);
        
        try {
            String title = "기부 반려";
            String message = "귀하의 기부 신청이 반려되었습니다. 사유: " + reason;
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

        return donationRepository.save(donation);
    }

    @Override
    public Donation cancelDonation(Long donationId, String reason) {
        Donation donation = donationRepository.findById(donationId)
                .orElseThrow(() -> new IllegalArgumentException("기부 정보를 찾을 수 없습니다."));

        if (donation.getStatus() == DonationStatus.COMPLETED) {
            throw new IllegalStateException("완료된 기부는 취소할 수 없습니다.");
        }

        donation.setStatus(DonationStatus.CANCELLED);
        donation.setCancelReason(reason);
        
        try {
            String title = "기부 취소";
            String message = "기부가 취소되었습니다. 사유: " + reason;
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

        return donationRepository.save(donation);
    }

    @Override
    public Donation organApproveDonation(Long donationId, Organ organ) {
        Donation donation = donationRepository.findById(donationId)
                .orElseThrow(() -> new IllegalArgumentException("기부 정보를 찾을 수 없습니다."));

        if (donation.getOrgan() == null || !donation.getOrgan().getId().equals(organ.getId())) {
            throw new IllegalStateException("해당 기관에 할당된 기부만 승인할 수 있습니다.");
        }

        // 최종 승인 시 COMPLETED 상태로 변경하여 "받은 기부" 목록에 표시
        donation.setStatus(DonationStatus.COMPLETED);

        Donation savedDonation = donationRepository.save(donation);

        // 배송 정보가 없으면 기본 배송 정보 생성 (배송 상태: 대기)
        if (savedDonation.getDelivery() == null) {
            com.rewear.delivery.entity.Delivery delivery = com.rewear.delivery.entity.Delivery.builder()
                    .donation(savedDonation)
                    .senderName(savedDonation.getDonor() != null && savedDonation.getDonor().getName() != null ? savedDonation.getDonor().getName() : "미정")
                    .senderPhone(savedDonation.getDonor() != null && savedDonation.getDonor().getPhone() != null ? savedDonation.getDonor().getPhone() : "010-0000-0000")
                    .senderAddress(savedDonation.getDonor() != null && savedDonation.getDonor().getAddress() != null ? savedDonation.getDonor().getAddress() : "주소 미정")
                    .receiverName(organ.getOrgName() != null ? organ.getOrgName() : "미정")
                    .receiverPhone("010-0000-0000")
                    .receiverAddress("주소 미정")
                    .status(com.rewear.common.enums.DeliveryStatus.PENDING)
                    .build();
            
            deliveryRepository.save(delivery);
        } else {
            // 배송 정보가 이미 있으면 상태를 대기로 설정
            savedDonation.getDelivery().setStatus(com.rewear.common.enums.DeliveryStatus.PENDING);
            deliveryRepository.save(savedDonation.getDelivery());
        }

        // 기부자에게 알림
        try {
            String title = "기부 승인 완료";
            String message = String.format("'%s' 기관이 기부를 최종 승인하여 완료되었습니다.", organ.getOrgName());
            notificationService.createNotification(
                donation.getDonor(),
                com.rewear.common.enums.NotificationType.DONATION_APPROVED,
                title,
                message,
                savedDonation.getId(),
                "donation"
            );
        } catch (Exception e) {
            log.warn("기부자 알림 생성 실패: {}", e.getMessage());
        }
        
        // 기관에게도 알림
        if (organ.getUser() != null) {
            try {
                String organTitle = "기부 승인 완료";
                String organMessage = String.format("귀하의 기관이 기부를 승인하여 완료되었습니다.");
                notificationService.createNotification(
                    organ.getUser(),
                    com.rewear.common.enums.NotificationType.DONATION_APPROVED,
                    organTitle,
                    organMessage,
                    savedDonation.getId(),
                    "donation"
                );
            } catch (Exception e) {
                log.warn("기관 알림 생성 실패: {}", e.getMessage());
            }
        }

        return savedDonation;
    }

    @Override
    public Donation organRejectDonation(Long donationId, Organ organ) {
        Donation donation = donationRepository.findById(donationId)
                .orElseThrow(() -> new IllegalArgumentException("기부 정보를 찾을 수 없습니다."));

        if (donation.getOrgan() == null || !donation.getOrgan().getId().equals(organ.getId())) {
            throw new IllegalStateException("해당 기관에 할당된 기부만 거부할 수 있습니다.");
        }

        // 반려 시 기부 요청 삭제 (CANCELLED 상태로 변경)
        donation.setStatus(DonationStatus.CANCELLED);
        donation.setCancelReason("기관이 기부를 반려했습니다.");

        try {
            String title = "기부 반려";
            String message = String.format("'%s' 기관이 기부를 반려했습니다.", organ.getOrgName());
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

        // 기관 할당 해제
        donation.setOrgan(null);
        
        return donationRepository.save(donation);
    }

}
