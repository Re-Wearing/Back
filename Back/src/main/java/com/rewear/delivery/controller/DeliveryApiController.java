package com.rewear.delivery.controller;

import com.rewear.common.enums.DonationStatus;
import com.rewear.common.enums.Role;
import com.rewear.delivery.entity.Delivery;
import com.rewear.delivery.service.DeliveryService;
import com.rewear.donation.entity.Donation;
import com.rewear.donation.repository.DonationRepository;
import com.rewear.organ.entity.Organ;
import com.rewear.organ.service.OrganService;
import com.rewear.user.details.CustomUserDetails;
import com.rewear.user.entity.User;
import com.rewear.user.service.UserServiceImpl;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Slf4j
@RestController
@RequestMapping("/api/deliveries")
@RequiredArgsConstructor
@PreAuthorize("isAuthenticated()")
public class DeliveryApiController {

    private final DeliveryService deliveryService;
    private final DonationRepository donationRepository;
    private final UserServiceImpl userService;
    private final OrganService organService;

    /**
     * 배송 목록 조회 API
     * - 기부자: 자신이 보낸 기부의 배송 정보
     * - 기관 회원: 자신이 받은 기부의 배송 정보
     */
    @GetMapping
    public ResponseEntity<Map<String, Object>> getDeliveries(
            @AuthenticationPrincipal CustomUserDetails principal) {
        
        User user = userService.findByUsername(principal.getUsername())
                .orElseThrow(() -> new IllegalStateException("사용자를 찾을 수 없습니다."));

        List<Map<String, Object>> deliveryList;
        
        // 기관 회원인 경우
        if (user.getRoles() != null && user.getRoles().contains(Role.ORGAN)) {
            // 기관 정보 가져오기
            Optional<Organ> organOpt = organService.findByUserId(user.getId());
            if (organOpt.isPresent()) {
                Organ organ = organOpt.get();
                log.info("기관 배송 목록 조회 시작 - 기관명: {}, organId: {}", organ.getOrgName(), organ.getId());
                
                // 해당 기관에 할당된 기부 중 배송 정보가 있는 모든 기부 조회
                // 상태 제한 없이 배송 정보가 있는 모든 기부를 조회
                List<Donation> organDonations = donationRepository.findAllWithDetails().stream()
                        .filter(d -> {
                            boolean hasOrgan = d.getOrgan() != null;
                            boolean isSameOrgan = hasOrgan && d.getOrgan().getId().equals(organ.getId());
                            boolean hasDelivery = d.getDelivery() != null;
                            // 취소된 기부는 제외
                            boolean isNotCancelled = d.getStatus() != DonationStatus.CANCELLED;
                            return isSameOrgan && hasDelivery && isNotCancelled;
                        })
                        .collect(Collectors.toList());
                
                log.info("기관에 할당된 배송 정보가 있는 기부 개수: {}", organDonations.size());
                
                // 해당 기부들과 연결된 배송 정보만 조회 (기부 생성일 기준 내림차순 정렬)
                deliveryList = organDonations.stream()
                        .sorted((d1, d2) -> {
                            // 기부 생성일 기준 내림차순 (최신순)
                            if (d1.getCreatedAt() != null && d2.getCreatedAt() != null) {
                                return d2.getCreatedAt().compareTo(d1.getCreatedAt());
                            }
                            return 0;
                        })
                        .map(donation -> {
                            if (donation.getDelivery() != null) {
                                return donation.getDelivery();
                            }
                            return null;
                        })
                        .filter(delivery -> delivery != null)
                        .map(this::convertToDeliveryDto)
                        .collect(Collectors.toList());
                
                log.info("기관 배송 목록 조회 완료 - 기관명: {}, 배송 개수: {}", organ.getOrgName(), deliveryList.size());
            } else {
                log.warn("기관 정보를 찾을 수 없습니다. userId: {}", user.getId());
                deliveryList = List.of();
            }
        } else {
            // 일반 사용자(기부자)인 경우: 자신이 보낸 기부의 배송 정보
            deliveryList = deliveryService.getDeliveriesByDonor(user).stream()
                    .map(this::convertToDeliveryDto)
                    .collect(Collectors.toList());
        }

        Map<String, Object> response = new HashMap<>();
        response.put("deliveries", deliveryList);
        
        return ResponseEntity.ok(response);
    }

    /**
     * 배송 상세 조회 API
     */
    @GetMapping("/{deliveryId}")
    public ResponseEntity<Map<String, Object>> getDelivery(
            @PathVariable Long deliveryId,
            @AuthenticationPrincipal CustomUserDetails principal) {
        
        User user = userService.findByUsername(principal.getUsername())
                .orElseThrow(() -> new IllegalStateException("사용자를 찾을 수 없습니다."));

        Delivery delivery = deliveryService.getDeliveryById(deliveryId)
                .orElseThrow(() -> new IllegalArgumentException("배송 정보를 찾을 수 없습니다."));

        // 권한 확인: 기부자이거나 수령인(기관)인지 확인
        boolean hasPermission = false;
        
        // 기부자인지 확인
        if (delivery.getDonation() != null && delivery.getDonation().getDonor() != null) {
            if (delivery.getDonation().getDonor().getId().equals(user.getId())) {
                hasPermission = true;
            }
        }
        
        // 기관 회원인 경우 수령인인지 확인
        if (!hasPermission && user.getRoles() != null && user.getRoles().contains(Role.ORGAN)) {
            Optional<Organ> organOpt = organService.findByUserId(user.getId());
            if (organOpt.isPresent()) {
                String organName = organOpt.get().getOrgName();
                if (delivery.getReceiverName() != null && delivery.getReceiverName().equals(organName)) {
                    hasPermission = true;
                }
            }
        }
        
        if (!hasPermission) {
            return ResponseEntity.status(403).body(Map.of("error", "권한이 없습니다."));
        }

        Map<String, Object> response = convertToDeliveryDto(delivery);
        
        return ResponseEntity.ok(response);
    }

    /**
     * Delivery 엔티티를 프론트엔드에서 사용할 수 있는 형태로 변환
     */
    private Map<String, Object> convertToDeliveryDto(Delivery delivery) {
        Map<String, Object> dto = new HashMap<>();
        dto.put("id", delivery.getId());
        dto.put("trackingNumber", delivery.getTrackingNumber());
        dto.put("carrier", delivery.getCarrier());
        dto.put("senderName", delivery.getSenderName());
        dto.put("senderPhone", delivery.getSenderPhone());
        dto.put("senderAddress", delivery.getSenderAddress());
        dto.put("senderDetailAddress", delivery.getSenderDetailAddress());
        dto.put("senderPostalCode", delivery.getSenderPostalCode());
        dto.put("receiverName", delivery.getReceiverName());
        dto.put("receiverPhone", delivery.getReceiverPhone());
        dto.put("receiverAddress", delivery.getReceiverAddress());
        dto.put("receiverDetailAddress", delivery.getReceiverDetailAddress());
        dto.put("receiverPostalCode", delivery.getReceiverPostalCode());
        dto.put("status", delivery.getStatus() != null ? delivery.getStatus().name() : "PENDING");
        dto.put("shippedAt", delivery.getShippedAt() != null ? delivery.getShippedAt().toString() : null);
        dto.put("deliveredAt", delivery.getDeliveredAt() != null ? delivery.getDeliveredAt().toString() : null);
        dto.put("createdAt", delivery.getCreatedAt() != null ? delivery.getCreatedAt().toString() : null);
        dto.put("updatedAt", delivery.getUpdatedAt() != null ? delivery.getUpdatedAt().toString() : null);
        
        // Donation 정보 포함
        if (delivery.getDonation() != null) {
            Donation donation = delivery.getDonation();
            Map<String, Object> donationInfo = new HashMap<>();
            donationInfo.put("id", donation.getId());
            
            // 물품 상세 정보 포함
            if (donation.getDonationItem() != null) {
                Map<String, Object> itemInfo = new HashMap<>();
                itemInfo.put("mainCategory", donation.getDonationItem().getMainCategory() != null 
                    ? donation.getDonationItem().getMainCategory().name() : null);
                itemInfo.put("detailCategory", donation.getDonationItem().getDetailCategory());
                itemInfo.put("size", donation.getDonationItem().getSize() != null 
                    ? donation.getDonationItem().getSize().name() : null);
                itemInfo.put("genderType", donation.getDonationItem().getGenderType() != null 
                    ? donation.getDonationItem().getGenderType().name() : null);
                itemInfo.put("description", donation.getDonationItem().getDescription());
                itemInfo.put("quantity", donation.getDonationItem().getQuantity() != null 
                    ? donation.getDonationItem().getQuantity() : 1);
                itemInfo.put("imageUrl", donation.getDonationItem().getImageUrl());
                itemInfo.put("imageUrls", donation.getDonationItem().getImageUrls());
                
                // 물품명 (detailCategory가 있으면 사용, 없으면 mainCategory 사용)
                String itemName = donation.getDonationItem().getDetailCategory();
                if (itemName == null || itemName.isEmpty()) {
                    itemName = donation.getDonationItem().getMainCategory() != null 
                        ? donation.getDonationItem().getMainCategory().name() : "기부 물품";
                }
                itemInfo.put("name", itemName);
                
                donationInfo.put("donationItem", itemInfo);
            } else {
                donationInfo.put("donationItem", null);
            }
            
            dto.put("donation", donationInfo);
        }
        
        return dto;
    }
}

