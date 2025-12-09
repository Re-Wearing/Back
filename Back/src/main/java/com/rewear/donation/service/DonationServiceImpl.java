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
import com.rewear.user.service.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class DonationServiceImpl implements DonationService {

    private final DonationRepository donationRepository;
    private final com.rewear.notification.service.NotificationService notificationService;
    private final com.rewear.delivery.repository.DeliveryRepository deliveryRepository;
    private final UserService userService;

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
        
        // 이미지 URL 검증
        if (imageUrl == null && (itemForm.getImageUrls() == null || itemForm.getImageUrls().isEmpty())) {
            throw new IllegalArgumentException("물품 이미지를 최소 1개 이상 업로드해주세요.");
        }

        DonationItem item = DonationItem.builder()
                .owner(donor)
                .genderType(itemForm.getGenderType())
                .mainCategory(itemForm.getMainCategory())
                .detailCategory(itemForm.getDetailCategory())
                .size(itemForm.getSize())
                .description(itemForm.getDescription())
                .imageUrl(imageUrl)
                .imageUrls(imageUrls)
                .quantity(itemForm.getQuantity() != null ? itemForm.getQuantity() : 1)
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
                .contact(form.getContact())
                .desiredDate(form.getDesiredDate())
                .memo(form.getMemo())
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
    public Donation assignDonationToOrgan(Long donationId, Organ organ, String carrier, String trackingNumber) {
        Donation donation = donationRepository.findById(donationId)
                .orElseThrow(() -> new IllegalArgumentException("기부 정보를 찾을 수 없습니다."));

        if (donation.getStatus() == DonationStatus.SHIPPED || donation.getStatus() == DonationStatus.COMPLETED) {
            throw new IllegalStateException("이미 배송 중이거나 완료된 기부입니다.");
        }

        if (donation.getMatchType() != MatchType.INDIRECT) {
            throw new IllegalStateException("간접 매칭 기부만 관리자가 기관을 할당할 수 있습니다.");
        }

        donation.setOrgan(organ);
        Donation savedDonation = donationRepository.save(donation);
        
        // 택배 배송인 경우 배송 정보 생성 또는 업데이트
        if (donation.getDeliveryMethod() == com.rewear.common.enums.DeliveryMethod.PARCEL_DELIVERY) {
            Optional<com.rewear.delivery.entity.Delivery> existingDelivery = deliveryRepository.findByDonation(savedDonation);
            
            if (existingDelivery.isPresent()) {
                // 배송 정보가 있으면 택배사와 운송장 번호 업데이트
                com.rewear.delivery.entity.Delivery delivery = existingDelivery.get();
                if (carrier != null && !carrier.isEmpty()) {
                    delivery.setCarrier(carrier);
                }
                if (trackingNumber != null && !trackingNumber.isEmpty()) {
                    delivery.setTrackingNumber(trackingNumber);
                }
                deliveryRepository.save(delivery);
            } else {
                // 배송 정보가 없으면 생성 (기관 정보는 나중에 기관 승인 시 업데이트됨)
                com.rewear.delivery.entity.Delivery delivery = com.rewear.delivery.entity.Delivery.builder()
                        .donation(savedDonation)
                        .senderName(savedDonation.getDonor() != null && savedDonation.getDonor().getName() != null ? savedDonation.getDonor().getName() : "미정")
                        .senderPhone(savedDonation.getDonor() != null && savedDonation.getDonor().getPhone() != null ? savedDonation.getDonor().getPhone() : "010-0000-0000")
                        .senderAddress(savedDonation.getDonor() != null && savedDonation.getDonor().getAddress() != null ? savedDonation.getDonor().getAddress() : "주소 미정")
                        .receiverName(organ.getOrgName() != null ? organ.getOrgName() : "미정")
                        .receiverPhone("010-0000-0000")
                        .receiverAddress("주소 미정")
                        .carrier(carrier != null && !carrier.isEmpty() ? carrier : null)
                        .trackingNumber(trackingNumber != null && !trackingNumber.isEmpty() ? trackingNumber : null)
                        .status(com.rewear.common.enums.DeliveryStatus.PENDING)
                        .build();
                deliveryRepository.save(delivery);
            }
        }
        
        return savedDonation;
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

        // 기존 제약 제거: 모든 상태에서 승인 가능
        // if (donation.getAdminDecision() != AdminDecision.PENDING) {
        //     throw new IllegalStateException("대기 상태인 기부만 승인할 수 있습니다.");
        // }

        // 간접 매칭인 경우 기관 할당 제약 제거: 먼저 승인하고 나중에 기관 할당 가능
        // if (donation.getMatchType() == MatchType.INDIRECT && donation.getOrgan() == null) {
        //     throw new IllegalStateException("간접 매칭 기부는 관리자가 기관을 할당한 후에만 승인할 수 있습니다.");
        // }

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

        // 기존 제약 제거: 모든 상태에서 거절 가능
        // if (donation.getAdminDecision() != AdminDecision.PENDING) {
        //     throw new IllegalStateException("대기 상태인 기부만 반려할 수 있습니다.");
        // }

        donation.setAdminDecision(AdminDecision.REJECTED);
        donation.setCancelReason(reason);
        
        // 간접 매칭인 경우 기관 할당 해제
        if (donation.getMatchType() == com.rewear.common.enums.MatchType.INDIRECT) {
            donation.setOrgan(null);
        }
        
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
    public Donation organApproveDonation(Long donationId, Organ organ, String carrier, String trackingNumber) {
        Donation donation = donationRepository.findById(donationId)
                .orElseThrow(() -> new IllegalArgumentException("기부 정보를 찾을 수 없습니다."));

        if (donation.getOrgan() == null || !donation.getOrgan().getId().equals(organ.getId())) {
            throw new IllegalStateException("해당 기관에 할당된 기부만 승인할 수 있습니다.");
        }

        // 기관이 수락한 기부는 모두 COMPLETED 상태로 변경하여 "기부 내역 조회"에 표시
        // (직접 매칭과 간접 매칭 모두 동일하게 처리)
        donation.setStatus(DonationStatus.COMPLETED);

        Donation savedDonation = donationRepository.save(donation);

        // 배송 정보가 없으면 기본 배송 정보 생성 (배송 상태: 대기)
        if (savedDonation.getDelivery() == null) {
            // 기관의 User 정보 가져오기 (LAZY 로딩 문제 해결을 위해 명시적으로 조회)
            User organUser = null;
            try {
                // organ을 다시 조회하여 User 정보를 확실히 로드
                if (organ.getUser() != null && organ.getUser().getId() != null) {
                    organUser = userService.getUserById(organ.getUser().getId());
                    log.info("기관 User 정보 조회 성공 - organId: {}, userId: {}, phone: {}, address: {}", 
                        organ.getId(), organUser.getId(), organUser.getPhone(), organUser.getAddress());
                }
            } catch (Exception e) {
                log.warn("기관 User 정보 조회 실패: {}", e.getMessage());
            }
            
            String receiverPhone = "010-0000-0000";
            String receiverAddress = "주소 미정";
            String receiverPostalCode = null;
            
            if (organUser != null) {
                // 전화번호 포맷팅 (01012345678 -> 010-1234-5678)
                if (organUser.getPhone() != null && !organUser.getPhone().isEmpty()) {
                    String phoneDigits = organUser.getPhone().replaceAll("\\D", "");
                    if (phoneDigits.length() == 11) {
                        receiverPhone = phoneDigits.substring(0, 3) + "-" + 
                                      phoneDigits.substring(3, 7) + "-" + 
                                      phoneDigits.substring(7);
                    } else if (phoneDigits.length() == 10) {
                        receiverPhone = phoneDigits.substring(0, 3) + "-" + 
                                      phoneDigits.substring(3, 6) + "-" + 
                                      phoneDigits.substring(6);
                    } else {
                        receiverPhone = organUser.getPhone();
                    }
                }
                
                // 주소 정보 가져오기
                if (organUser.getAddress() != null && !organUser.getAddress().isEmpty() && !organUser.getAddress().equals("주소 미입력")) {
                    receiverAddress = organUser.getAddress();
                }
                if (organUser.getAddressPostcode() != null && !organUser.getAddressPostcode().isEmpty()) {
                    receiverPostalCode = organUser.getAddressPostcode();
                }
                
                log.info("기관 배송 정보 설정 - 기관명: {}, 전화번호: {}, 주소: {}, 우편번호: {}", 
                    organ.getOrgName(), receiverPhone, receiverAddress, receiverPostalCode);
            } else {
                log.warn("기관 User 정보를 찾을 수 없습니다. organId: {}", organ.getId());
            }
            
            com.rewear.delivery.entity.Delivery.DeliveryBuilder deliveryBuilder = com.rewear.delivery.entity.Delivery.builder()
                    .donation(savedDonation)
                    .senderName(savedDonation.getDonor() != null && savedDonation.getDonor().getName() != null ? savedDonation.getDonor().getName() : "미정")
                    .senderPhone(savedDonation.getDonor() != null && savedDonation.getDonor().getPhone() != null ? savedDonation.getDonor().getPhone() : "010-0000-0000")
                    .senderAddress(savedDonation.getDonor() != null && savedDonation.getDonor().getAddress() != null ? savedDonation.getDonor().getAddress() : "주소 미정")
                    .receiverName(organ.getOrgName() != null ? organ.getOrgName() : "미정")
                    .receiverPhone(receiverPhone)
                    .receiverAddress(receiverAddress)
                    .receiverPostalCode(receiverPostalCode)
                    .status(com.rewear.common.enums.DeliveryStatus.PENDING);
            
            // 택배 정보가 있으면 추가
            if (carrier != null && !carrier.isEmpty()) {
                deliveryBuilder.carrier(carrier);
            }
            if (trackingNumber != null && !trackingNumber.isEmpty()) {
                deliveryBuilder.trackingNumber(trackingNumber);
            }
            
            com.rewear.delivery.entity.Delivery delivery = deliveryBuilder.build();
            deliveryRepository.save(delivery);
        } else {
            // 배송 정보가 이미 있으면 기관 정보로 업데이트
            User organUser = null;
            try {
                // organ을 다시 조회하여 User 정보를 확실히 로드
                if (organ.getUser() != null && organ.getUser().getId() != null) {
                    organUser = userService.getUserById(organ.getUser().getId());
                    log.info("기관 User 정보 조회 성공 (업데이트) - organId: {}, userId: {}, phone: {}, address: {}", 
                        organ.getId(), organUser.getId(), organUser.getPhone(), organUser.getAddress());
                }
            } catch (Exception e) {
                log.warn("기관 User 정보 조회 실패 (업데이트): {}", e.getMessage());
            }
            
            if (organUser != null) {
                // 전화번호 업데이트
                if (organUser.getPhone() != null && !organUser.getPhone().isEmpty()) {
                    String phoneDigits = organUser.getPhone().replaceAll("\\D", "");
                    if (phoneDigits.length() == 11) {
                        savedDonation.getDelivery().setReceiverPhone(
                            phoneDigits.substring(0, 3) + "-" + 
                            phoneDigits.substring(3, 7) + "-" + 
                            phoneDigits.substring(7)
                        );
                    } else if (phoneDigits.length() == 10) {
                        savedDonation.getDelivery().setReceiverPhone(
                            phoneDigits.substring(0, 3) + "-" + 
                            phoneDigits.substring(3, 6) + "-" + 
                            phoneDigits.substring(6)
                        );
                    } else {
                        savedDonation.getDelivery().setReceiverPhone(organUser.getPhone());
                    }
                }
                
                // 주소 업데이트
                if (organUser.getAddress() != null && !organUser.getAddress().isEmpty() && !organUser.getAddress().equals("주소 미입력")) {
                    savedDonation.getDelivery().setReceiverAddress(organUser.getAddress());
                }
                if (organUser.getAddressPostcode() != null && !organUser.getAddressPostcode().isEmpty()) {
                    savedDonation.getDelivery().setReceiverPostalCode(organUser.getAddressPostcode());
                }
                
                log.info("기관 배송 정보 업데이트 - 기관명: {}, 전화번호: {}, 주소: {}, 우편번호: {}", 
                    organ.getOrgName(), savedDonation.getDelivery().getReceiverPhone(), 
                    savedDonation.getDelivery().getReceiverAddress(), savedDonation.getDelivery().getReceiverPostalCode());
            } else {
                log.warn("기관 User 정보를 찾을 수 없습니다. organId: {}", organ.getId());
            }
            
            // 택배 정보가 있으면 업데이트
            if (carrier != null && !carrier.isEmpty()) {
                savedDonation.getDelivery().setCarrier(carrier);
            }
            if (trackingNumber != null && !trackingNumber.isEmpty()) {
                savedDonation.getDelivery().setTrackingNumber(trackingNumber);
            }
            
            if (carrier != null || trackingNumber != null) {
                deliveryRepository.save(savedDonation.getDelivery());
            }
            
            // 상태를 대기로 설정
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
