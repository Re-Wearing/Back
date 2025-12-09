package com.rewear.organ.controller;

import com.rewear.common.enums.MatchType;
import com.rewear.common.enums.OrganStatus;
import com.rewear.common.enums.DonationStatus;
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
@RequestMapping("/api/organs")
@RequiredArgsConstructor
public class OrganApiController {

    private final OrganService organService;
    private final DonationRepository donationRepository;
    private final UserServiceImpl userService;
    private final com.rewear.donation.service.DonationService donationService;

    /**
     * 승인된 기관 목록 조회 API
     */
    @GetMapping
    public ResponseEntity<Map<String, Object>> getApprovedOrgans() {
        try {
            List<Organ> organs = organService.findByStatus(OrganStatus.APPROVED);
            
            List<Map<String, Object>> organList = organs.stream()
                    .map(organ -> {
                        Map<String, Object> organDto = new HashMap<>();
                        organDto.put("id", organ.getId());
                        organDto.put("name", organ.getOrgName());
                        organDto.put("orgName", organ.getOrgName());
                        organDto.put("username", organ.getUser() != null ? organ.getUser().getUsername() : null);
                        organDto.put("businessNo", organ.getBusinessNo());
                        return organDto;
                    })
                    .collect(Collectors.toList());
            
            Map<String, Object> response = new HashMap<>();
            response.put("organs", organList);
            response.put("count", organList.size());
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("승인된 기관 목록 조회 오류", e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", true);
            errorResponse.put("message", "기관 목록 조회 중 오류가 발생했습니다: " + e.getMessage());
            return ResponseEntity.status(500).body(errorResponse);
        }
    }

    /**
     * 기관에 할당된 매칭된 기부 목록 조회 API
     */
    @GetMapping("/donations")
    @PreAuthorize("hasRole('ORGAN')")
    public ResponseEntity<Map<String, Object>> getOrganDonations(
            @AuthenticationPrincipal CustomUserDetails principal) {
        try {
            User user = userService.findByUsername(principal.getUsername())
                    .orElseThrow(() -> new IllegalStateException("사용자를 찾을 수 없습니다."));

            Optional<Organ> organOpt = organService.findByUserId(user.getId());
            if (organOpt.isEmpty()) {
                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("error", true);
                errorResponse.put("message", "기관 정보를 찾을 수 없습니다.");
                return ResponseEntity.badRequest().body(errorResponse);
            }

            Organ organ = organOpt.get();
            
            // IN_PROGRESS 상태인 기부 목록 조회
            List<Donation> allDonations = donationRepository.findAllWithDetails();
            List<Donation> donations = allDonations.stream()
                    .filter(d -> d.getStatus() == DonationStatus.IN_PROGRESS)
                    .filter(d -> d.getStatus() != DonationStatus.CANCELLED)
                    .filter(d -> {
                        // 직접 매칭인 경우
                        if (d.getMatchType() == MatchType.DIRECT) {
                            return d.getOrgan() != null && d.getOrgan().getId().equals(organ.getId());
                        }
                        // 간접 매칭인 경우
                        if (d.getMatchType() == MatchType.INDIRECT) {
                            return d.getOrgan() != null && d.getOrgan().getId().equals(organ.getId());
                        }
                        return false;
                    })
                    .collect(Collectors.toList());
            
            List<Map<String, Object>> donationList = donations.stream()
                    .map(this::convertToOrganDonationDto)
                    .collect(Collectors.toList());
            
            Map<String, Object> response = new HashMap<>();
            response.put("donations", donationList);
            response.put("count", donationList.size());
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("기관 기부 목록 조회 오류", e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", true);
            errorResponse.put("message", "기부 목록 조회 중 오류가 발생했습니다: " + e.getMessage());
            return ResponseEntity.status(500).body(errorResponse);
        }
    }

    /**
     * Donation 엔티티를 기관용 DTO로 변환 (매칭 제안 형식)
     */
    private Map<String, Object> convertToOrganDonationDto(Donation donation) {
        Map<String, Object> dto = new HashMap<>();
        
        dto.put("id", donation.getId());
        dto.put("itemId", donation.getId().toString());
        dto.put("donorName", donation.getDonor() != null ? 
                (donation.getDonor().getName() != null ? donation.getDonor().getName() : donation.getDonor().getUsername()) : "익명");
        dto.put("organizationUsername", donation.getOrgan() != null && donation.getOrgan().getUser() != null 
                ? donation.getOrgan().getUser().getUsername() : null);
        dto.put("organizationName", donation.getOrgan() != null ? donation.getOrgan().getOrgName() : null);
        
        // 물품 정보
        if (donation.getDonationItem() != null) {
            dto.put("itemName", donation.getDonationItem().getDetailCategory() != null && !donation.getDonationItem().getDetailCategory().isEmpty()
                    ? donation.getDonationItem().getDetailCategory()
                    : (donation.getDonationItem().getMainCategory() != null ? donation.getDonationItem().getMainCategory().name() : "기부 물품"));
            dto.put("itemDescription", donation.getDonationItem().getDescription());
            
            // 이미지 URL 처리
            List<Map<String, String>> images = new java.util.ArrayList<>();
            if (donation.getDonationItem().getImageUrls() != null && !donation.getDonationItem().getImageUrls().isEmpty()) {
                String[] imageUrlArray = donation.getDonationItem().getImageUrls().split(",");
                for (String url : imageUrlArray) {
                    if (url != null && !url.trim().isEmpty()) {
                        String trimmedUrl = url.trim();
                        String imageUrl = trimmedUrl.startsWith("/uploads/") ? trimmedUrl : "/uploads/" + trimmedUrl;
                        Map<String, String> imageMap = new HashMap<>();
                        imageMap.put("url", imageUrl);
                        imageMap.put("dataUrl", imageUrl);
                        images.add(imageMap);
                    }
                }
            } else if (donation.getDonationItem().getImageUrl() != null && !donation.getDonationItem().getImageUrl().isEmpty()) {
                String imageUrl = donation.getDonationItem().getImageUrl().startsWith("/uploads/") 
                        ? donation.getDonationItem().getImageUrl() 
                        : "/uploads/" + donation.getDonationItem().getImageUrl();
                Map<String, String> imageMap = new HashMap<>();
                imageMap.put("url", imageUrl);
                imageMap.put("dataUrl", imageUrl);
                images.add(imageMap);
            }
            dto.put("images", images);
        } else {
            dto.put("itemName", "기부 물품");
            dto.put("itemDescription", null);
            dto.put("images", List.of());
        }
        
        // 기부 방법
        dto.put("donationMethod", donation.getMatchType() == MatchType.DIRECT ? "직접 매칭" : "자동 매칭");
        
        // 상태 - 매칭 제안 형식으로 변환
        dto.put("status", "pending"); // 할당된 기부는 아직 기관이 승인/거부하지 않은 상태
        
        // 메시지
        dto.put("message", "관리자가 귀하의 기관에 할당한 기부입니다.");
        
        // 배송 방법
        if (donation.getDeliveryMethod() != null) {
            dto.put("deliveryMethod", donation.getDeliveryMethod() == com.rewear.common.enums.DeliveryMethod.PARCEL_DELIVERY ? "택배 배송" : "직접 배송");
        } else {
            dto.put("deliveryMethod", null);
        }
        
        // 연락처, 희망일, 메모
        dto.put("contact", donation.getContact());
        dto.put("desiredDate", donation.getDesiredDate() != null ? donation.getDesiredDate().toString() : null);
        dto.put("memo", donation.getMemo());
        dto.put("isAnonymous", donation.getIsAnonymous() != null ? donation.getIsAnonymous() : false);
        
        return dto;
    }

    /**
     * 기관이 받은 기부 목록 조회 API (COMPLETED 상태)
     */
    @GetMapping("/donations/completed")
    @PreAuthorize("hasRole('ORGAN')")
    public ResponseEntity<Map<String, Object>> getCompletedDonations(
            @AuthenticationPrincipal CustomUserDetails principal) {
        try {
            User user = userService.findByUsername(principal.getUsername())
                    .orElseThrow(() -> new IllegalStateException("사용자를 찾을 수 없습니다."));

            Optional<Organ> organOpt = organService.findByUserId(user.getId());
            if (organOpt.isEmpty()) {
                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("error", true);
                errorResponse.put("message", "기관 정보를 찾을 수 없습니다.");
                return ResponseEntity.badRequest().body(errorResponse);
            }

            Organ organ = organOpt.get();
            
            // COMPLETED 상태인 기부 목록 조회
            List<Donation> allDonations = donationRepository.findAllWithDetails();
            List<Donation> completedDonations = allDonations.stream()
                    .filter(d -> d.getOrgan() != null && d.getOrgan().getId().equals(organ.getId()))
                    .filter(d -> d.getStatus() == DonationStatus.COMPLETED)
                    .collect(Collectors.toList());
            
            List<Map<String, Object>> donationList = completedDonations.stream()
                    .map(donation -> convertToCompletedDonationDto(donation))
                    .collect(Collectors.toList());
            
            Map<String, Object> response = new HashMap<>();
            response.put("donations", donationList);
            response.put("count", donationList.size());
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("완료된 기부 목록 조회 오류", e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", true);
            errorResponse.put("message", "기부 목록 조회 중 오류가 발생했습니다: " + e.getMessage());
            return ResponseEntity.status(500).body(errorResponse);
        }
    }

    /**
     * 완료된 기부를 DTO로 변환 (배송 정보 포함)
     */
    private Map<String, Object> convertToCompletedDonationDto(Donation donation) {
        Map<String, Object> dto = new HashMap<>();
        
        dto.put("id", donation.getId());
        dto.put("donorName", donation.getDonor() != null ? 
                (donation.getDonor().getName() != null ? donation.getDonor().getName() : donation.getDonor().getUsername()) : "익명");
        
        // 물품 정보
        if (donation.getDonationItem() != null) {
            dto.put("itemName", donation.getDonationItem().getDetailCategory() != null && !donation.getDonationItem().getDetailCategory().isEmpty()
                    ? donation.getDonationItem().getDetailCategory()
                    : (donation.getDonationItem().getMainCategory() != null ? donation.getDonationItem().getMainCategory().name() : "기부 물품"));
        } else {
            dto.put("itemName", "기부 물품");
        }
        
        // 날짜
        dto.put("date", donation.getCreatedAt() != null ? donation.getCreatedAt().toString().split("T")[0] : null);
        
        // 기관 정보
        dto.put("organization", donation.getOrgan() != null ? donation.getOrgan().getOrgName() : null);
        
        // 상태
        dto.put("status", "완료");
        
        // 배송 정보
        if (donation.getDelivery() != null) {
            Map<String, Object> deliveryInfo = new HashMap<>();
            deliveryInfo.put("id", donation.getDelivery().getId());
            deliveryInfo.put("trackingNumber", donation.getDelivery().getTrackingNumber());
            deliveryInfo.put("carrier", donation.getDelivery().getCarrier());
            deliveryInfo.put("status", donation.getDelivery().getStatus() != null ? donation.getDelivery().getStatus().name() : "PENDING");
            deliveryInfo.put("senderName", donation.getDelivery().getSenderName());
            deliveryInfo.put("senderPhone", donation.getDelivery().getSenderPhone());
            deliveryInfo.put("senderAddress", donation.getDelivery().getSenderAddress());
            deliveryInfo.put("receiverName", donation.getDelivery().getReceiverName());
            deliveryInfo.put("receiverPhone", donation.getDelivery().getReceiverPhone());
            deliveryInfo.put("receiverAddress", donation.getDelivery().getReceiverAddress());
            deliveryInfo.put("shippedAt", donation.getDelivery().getShippedAt() != null ? donation.getDelivery().getShippedAt().toString() : null);
            deliveryInfo.put("deliveredAt", donation.getDelivery().getDeliveredAt() != null ? donation.getDelivery().getDeliveredAt().toString() : null);
            dto.put("delivery", deliveryInfo);
        } else {
            dto.put("delivery", null);
        }
        
        return dto;
    }

    /**
     * 기관이 기부 승인
     */
    @PostMapping("/donations/{donationId}/approve")
    @PreAuthorize("hasRole('ORGAN')")
    public ResponseEntity<Map<String, Object>> approveDonation(
            @PathVariable("donationId") Long donationId,
            @AuthenticationPrincipal CustomUserDetails principal) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            User user = userService.findByUsername(principal.getUsername())
                    .orElseThrow(() -> new IllegalStateException("사용자를 찾을 수 없습니다."));

            Optional<Organ> organOpt = organService.findByUserId(user.getId());
            if (organOpt.isEmpty()) {
                response.put("success", false);
                response.put("message", "기관 정보를 찾을 수 없습니다.");
                return ResponseEntity.badRequest().body(response);
            }

            Organ organ = organOpt.get();
            donationService.organApproveDonation(donationId, organ);
            
            response.put("success", true);
            response.put("message", "기부를 최종 승인하여 완료되었습니다.");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("기부 승인 오류", e);
            response.put("success", false);
            response.put("message", "기부 승인 중 오류가 발생했습니다: " + e.getMessage());
            return ResponseEntity.status(500).body(response);
        }
    }

    /**
     * 기관이 기부 거부
     */
    @PostMapping("/donations/{donationId}/reject")
    @PreAuthorize("hasRole('ORGAN')")
    public ResponseEntity<Map<String, Object>> rejectDonation(
            @PathVariable("donationId") Long donationId,
            @RequestBody(required = false) Map<String, String> requestBody,
            @AuthenticationPrincipal CustomUserDetails principal) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            User user = userService.findByUsername(principal.getUsername())
                    .orElseThrow(() -> new IllegalStateException("사용자를 찾을 수 없습니다."));

            Optional<Organ> organOpt = organService.findByUserId(user.getId());
            if (organOpt.isEmpty()) {
                response.put("success", false);
                response.put("message", "기관 정보를 찾을 수 없습니다.");
                return ResponseEntity.badRequest().body(response);
            }

            Organ organ = organOpt.get();
            donationService.organRejectDonation(donationId, organ);
            
            response.put("success", true);
            response.put("message", "기부를 반려했습니다.");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("기부 거부 오류", e);
            response.put("success", false);
            response.put("message", "기부 거부 중 오류가 발생했습니다: " + e.getMessage());
            return ResponseEntity.status(500).body(response);
        }
    }
}

