package com.rewear.delivery.controller;

import com.rewear.delivery.entity.Delivery;
import com.rewear.delivery.service.DeliveryService;
import com.rewear.donation.entity.Donation;
import com.rewear.donation.repository.DonationRepository;
import com.rewear.user.details.CustomUserDetails;
import com.rewear.user.entity.User;
import com.rewear.user.service.UserServiceImpl;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/deliveries")
@RequiredArgsConstructor
@PreAuthorize("isAuthenticated()")
public class DeliveryApiController {

    private final DeliveryService deliveryService;
    private final DonationRepository donationRepository;
    private final UserServiceImpl userService;

    /**
     * 배송 목록 조회 API
     */
    @GetMapping
    public ResponseEntity<Map<String, Object>> getDeliveries(
            @AuthenticationPrincipal CustomUserDetails principal) {
        
        User user = userService.findByUsername(principal.getUsername())
                .orElseThrow(() -> new IllegalStateException("사용자를 찾을 수 없습니다."));

        // 사용자의 기부 목록 가져오기
        List<Donation> donations = donationRepository.findByDonor(user);
        
        // 각 기부에 대한 배송 정보 가져오기
        List<Map<String, Object>> deliveryList = donations.stream()
                .map(donation -> deliveryService.getDeliveryByDonation(donation))
                .filter(delivery -> delivery.isPresent())
                .map(delivery -> delivery.get())
                .map(this::convertToDeliveryDto)
                .collect(Collectors.toList());

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

        // 본인의 기부인지 확인
        if (!delivery.getDonation().getDonor().getId().equals(user.getId())) {
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
            donationInfo.put("donationItem", donation.getDonationItem() != null ? donation.getDonationItem().getMainCategory() : null);
            dto.put("donation", donationInfo);
        }
        
        return dto;
    }
}

