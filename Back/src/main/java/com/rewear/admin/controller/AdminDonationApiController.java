package com.rewear.admin.controller;

import com.rewear.common.enums.AdminDecision;
import com.rewear.common.enums.DonationStatus;
import com.rewear.common.enums.MatchType;
import com.rewear.common.enums.OrganStatus;
import com.rewear.donation.entity.Donation;
import com.rewear.donation.service.DonationService;
import com.rewear.donation.util.DonationStatusConverter;
import com.rewear.organ.entity.Organ;
import com.rewear.organ.service.OrganService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@RestController
@RequestMapping("/api/admin/donations")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class AdminDonationApiController {

    private final DonationService donationService;
    private final OrganService organService;
    private final com.rewear.donation.repository.DonationRepository donationRepository;
    private final com.rewear.delivery.repository.DeliveryRepository deliveryRepository;
    
    @Value("${app.upload.dir:uploads}")
    private String uploadDir;

    /**
     * 승인 대기 기부 목록 조회 (PENDING 상태이면서 REJECTED가 아닌 것만)
     */
    @GetMapping("/pending")
    public ResponseEntity<?> getPendingDonations() {
        try {
            List<Donation> allPending = donationService.getDonationsByStatus(DonationStatus.PENDING);
            
            // AdminDecision이 PENDING인 것만 필터링 (REJECTED 제외)
            List<Donation> pendingDonations = allPending.stream()
                    .filter(d -> d.getAdminDecision() == AdminDecision.PENDING)
                    .collect(Collectors.toList());
            
            List<Map<String, Object>> donationList = pendingDonations.stream()
                    .map(this::convertToAdminDonationDto)
                    .collect(Collectors.toList());
            
            Map<String, Object> response = new HashMap<>();
            response.put("donations", donationList);
            response.put("count", donationList.size());
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("승인 대기 기부 목록 조회 오류", e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", true);
            errorResponse.put("message", "기부 목록 조회 중 오류가 발생했습니다: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    /**
     * 거절된 기부 목록 조회 (adminDecision이 REJECTED인 것들)
     */
    @GetMapping("/rejected")
    public ResponseEntity<?> getRejectedDonations() {
        try {
            // 모든 기부를 가져와서 adminDecision이 REJECTED인 것만 필터링
            List<Donation> allDonations = donationService.getAllDonations();
            List<Donation> rejectedDonations = allDonations.stream()
                    .filter(d -> d.getAdminDecision() == AdminDecision.REJECTED)
                    .collect(Collectors.toList());
            
            List<Map<String, Object>> donationList = rejectedDonations.stream()
                    .map(this::convertToAdminDonationDto)
                    .collect(Collectors.toList());
            
            Map<String, Object> response = new HashMap<>();
            response.put("donations", donationList);
            response.put("count", donationList.size());
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("거절된 기부 목록 조회 오류", e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", true);
            errorResponse.put("message", "기부 목록 조회 중 오류가 발생했습니다: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    /**
     * 승인 완료된 기부 목록 조회 (매칭대기 이상)
     */
    @GetMapping("/approved")
    public ResponseEntity<?> getApprovedDonations() {
        try {
            List<Donation> allInProgress = donationService.getDonationsByStatus(DonationStatus.IN_PROGRESS);
            List<Donation> allCompleted = donationService.getDonationsByStatus(DonationStatus.COMPLETED);
            List<Donation> allShipped = donationService.getDonationsByStatus(DonationStatus.SHIPPED);
            
            // 승인 완료된 것들 (매칭대기 이상) - PENDING이 아니고 REJECTED가 아닌 것들
            List<Donation> approvedDonations = new ArrayList<>();
            approvedDonations.addAll(allInProgress);
            approvedDonations.addAll(allCompleted);
            approvedDonations.addAll(allShipped);
            
            List<Map<String, Object>> donationList = approvedDonations.stream()
                    .map(this::convertToAdminDonationDto)
                    .collect(Collectors.toList());
            
            Map<String, Object> response = new HashMap<>();
            response.put("donations", donationList);
            response.put("count", donationList.size());
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("승인 완료된 기부 목록 조회 오류", e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", true);
            errorResponse.put("message", "기부 목록 조회 중 오류가 발생했습니다: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    /**
     * 자동 매칭 대기 기부 목록 조회
     * 간접 매칭으로 신청되고, 승인이 완료되었으며, 아직 기관이 할당되지 않은 기부만 표시
     */
    @GetMapping("/auto-match")
    public ResponseEntity<?> getAutoMatchDonations() {
        try {
            // 기관이 할당되지 않은 기부만 표시 (기관 할당 대기)
            List<Donation> unassignedDonations = donationService.getDonationsByStatus(DonationStatus.IN_PROGRESS).stream()
                    .filter(d -> d.getMatchType() == MatchType.INDIRECT 
                            && d.getAdminDecision() == AdminDecision.APPROVED 
                            && d.getOrgan() == null)
                    .collect(Collectors.toList());
            
            List<Map<String, Object>> donationList = unassignedDonations.stream()
                    .map(this::convertToAdminDonationDto)
                    .collect(Collectors.toList());
            
            Map<String, Object> response = new HashMap<>();
            response.put("donations", donationList);
            response.put("count", donationList.size());
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("자동 매칭 대기 기부 목록 조회 오류", e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", true);
            errorResponse.put("message", "기부 목록 조회 중 오류가 발생했습니다: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    /**
     * 택배 정보 입력 대기 기부 목록 조회
     * 기관이 할당되고 기관이 승인한 기부 중 택배 배송인 경우 (COMPLETED 상태, 배송 정보 없음)
     */
    @GetMapping("/delivery/input")
    public ResponseEntity<?> getDeliveryInputDonations() {
        try {
            // 기관이 할당되고 기관이 승인한 기부 (COMPLETED 상태, 택배 정보 입력 필요)
            List<Donation> organApprovedDonations = donationService.getDonationsByStatus(DonationStatus.COMPLETED).stream()
                    .filter(d -> {
                        // 기본 조건 확인
                        if (d.getMatchType() != MatchType.INDIRECT) {
                            return false;
                        }
                        if (d.getOrgan() == null) {
                            return false;
                        }
                        if (d.getDeliveryMethod() != com.rewear.common.enums.DeliveryMethod.PARCEL_DELIVERY) {
                            return false;
                        }
                        // 배송 정보가 없거나 택배 정보가 없는 경우
                        if (d.getDelivery() == null) {
                            return true; // 배송 정보가 없으면 택배 정보 입력 필요
                        }
                        // 배송 정보는 있지만 택배사나 운송장 번호가 없는 경우
                        return d.getDelivery().getCarrier() == null || 
                               d.getDelivery().getCarrier().isEmpty() ||
                               d.getDelivery().getTrackingNumber() == null || 
                               d.getDelivery().getTrackingNumber().isEmpty();
                    })
                    .collect(Collectors.toList());
            
            List<Map<String, Object>> donationList = organApprovedDonations.stream()
                    .map(this::convertToAdminDonationDto)
                    .collect(Collectors.toList());
            
            Map<String, Object> response = new HashMap<>();
            response.put("donations", donationList);
            response.put("count", donationList.size());
            
            log.info("택배 정보 입력 대기 기부 목록 조회 성공 - 개수: {}", donationList.size());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("택배 정보 입력 대기 기부 목록 조회 오류", e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", true);
            errorResponse.put("message", "기부 목록 조회 중 오류가 발생했습니다: " + e.getMessage());
            errorResponse.put("donations", new ArrayList<>());
            errorResponse.put("count", 0);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    /**
     * 택배 정보 업데이트 (기관이 승인한 기부에 대해)
     */
    @PutMapping("/{id}/delivery-info")
    public ResponseEntity<Map<String, Object>> updateDeliveryInfo(
            @PathVariable Long id,
            @RequestBody Map<String, Object> requestBody) {
        
        Map<String, Object> response = new HashMap<>();
        
        try {
            Donation donation = donationService.getDonationById(id);
            if (donation == null) {
                response.put("success", false);
                response.put("message", "기부를 찾을 수 없습니다.");
                return ResponseEntity.badRequest().body(response);
            }
            
            // 기관이 할당되고 승인한 기부인지 확인
            if (donation.getOrgan() == null) {
                response.put("success", false);
                response.put("message", "기관이 할당되지 않은 기부입니다.");
                return ResponseEntity.badRequest().body(response);
            }
            
            if (donation.getStatus() != DonationStatus.COMPLETED) {
                response.put("success", false);
                response.put("message", "기관이 승인하지 않은 기부입니다.");
                return ResponseEntity.badRequest().body(response);
            }
            
            // 택배 회사와 운송장 번호 추출
            String carrier = null;
            String trackingNumber = null;
            if (requestBody.containsKey("carrier")) {
                Object carrierObj = requestBody.get("carrier");
                if (carrierObj instanceof String && !((String) carrierObj).isEmpty()) {
                    carrier = (String) carrierObj;
                }
            }
            if (requestBody.containsKey("trackingNumber")) {
                Object trackingNumberObj = requestBody.get("trackingNumber");
                if (trackingNumberObj instanceof String && !((String) trackingNumberObj).isEmpty()) {
                    trackingNumber = (String) trackingNumberObj;
                }
            }
            
            if (carrier == null || trackingNumber == null) {
                response.put("success", false);
                response.put("message", "택배사와 운송장 번호를 모두 입력해주세요.");
                return ResponseEntity.badRequest().body(response);
            }
            
            // 배송 정보 업데이트
            if (donation.getDelivery() != null) {
                com.rewear.delivery.entity.Delivery delivery = donation.getDelivery();
                delivery.setCarrier(carrier);
                delivery.setTrackingNumber(trackingNumber);
                deliveryRepository.save(delivery);
            } else {
                // 배송 정보가 없으면 생성
                com.rewear.delivery.entity.Delivery delivery = com.rewear.delivery.entity.Delivery.builder()
                        .donation(donation)
                        .carrier(carrier)
                        .trackingNumber(trackingNumber)
                        .senderName(donation.getDonor() != null && donation.getDonor().getName() != null 
                                ? donation.getDonor().getName() : "미정")
                        .senderPhone(donation.getDonor() != null && donation.getDonor().getPhone() != null 
                                ? donation.getDonor().getPhone() : "010-0000-0000")
                        .senderAddress(donation.getDonor() != null && donation.getDonor().getAddress() != null 
                                ? donation.getDonor().getAddress() : "주소 미정")
                        .receiverName(donation.getOrgan().getOrgName())
                        .receiverPhone(donation.getOrgan().getUser() != null && donation.getOrgan().getUser().getPhone() != null
                                ? donation.getOrgan().getUser().getPhone() : "010-0000-0000")
                        .receiverAddress(donation.getOrgan().getUser() != null && donation.getOrgan().getUser().getAddress() != null
                                ? donation.getOrgan().getUser().getAddress() : "주소 미정")
                        .status(com.rewear.common.enums.DeliveryStatus.PENDING)
                        .build();
                deliveryRepository.save(delivery);
            }
            
            response.put("success", true);
            response.put("message", "택배 정보가 업데이트되었습니다.");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("택배 정보 업데이트 오류", e);
            response.put("success", false);
            response.put("message", "택배 정보 업데이트 중 오류가 발생했습니다: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    /**
     * 직접 매칭 대기 기부 목록 조회
     * 직접 매칭으로 신청되고, 승인 대기 중이거나 기관 확인을 기다리는 기부만 표시
     */
    @GetMapping("/direct-match")
    public ResponseEntity<?> getDirectMatchDonations() {
        try {
            // PENDING 상태의 직접 매칭 기부 (관리자 승인 대기)
            List<Donation> pendingAdminDecision = donationService.getDonationsByStatus(DonationStatus.PENDING).stream()
                    .filter(d -> d.getMatchType() == MatchType.DIRECT
                            && d.getAdminDecision() == AdminDecision.PENDING)
                    .collect(Collectors.toList());

            // IN_PROGRESS 상태의 직접 매칭 기부 (기관이 할당되었고, 기관이 승인했지만 아직 관리자가 택배 정보를 입력하지 않은 상태)
            List<Donation> inProgressOrganApproved = donationService.getDonationsByStatus(DonationStatus.IN_PROGRESS).stream()
                    .filter(d -> d.getMatchType() == MatchType.DIRECT
                            && d.getOrgan() != null
                            && d.getAdminDecision() == AdminDecision.APPROVED) // 관리자 승인 완료
                    .collect(Collectors.toList());

            List<Donation> allDirectMatch = new ArrayList<>();
            allDirectMatch.addAll(pendingAdminDecision);
            allDirectMatch.addAll(inProgressOrganApproved);

            List<Map<String, Object>> donationList = allDirectMatch.stream()
                    .map(this::convertToAdminDonationDto)
                    .collect(Collectors.toList());

            Map<String, Object> response = new HashMap<>();
            response.put("donations", donationList);
            response.put("count", donationList.size());

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("직접 매칭 대기 기부 목록 조회 오류", e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", true);
            errorResponse.put("message", "기부 목록 조회 중 오류가 발생했습니다: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    /**
     * 기부 상세 정보 조회
     */
    @GetMapping("/{id}")
    public ResponseEntity<?> getDonationDetail(@PathVariable Long id) {
        try {
            Donation donation = donationService.getDonationById(id);
            if (donation == null) {
                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("success", false);
                errorResponse.put("message", "기부를 찾을 수 없습니다.");
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(errorResponse);
            }
            
            Map<String, Object> donationDto = convertToAdminDonationDto(donation);
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("donation", donationDto);
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("기부 상세 정보 조회 오류", e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "기부 상세 정보 조회 중 오류가 발생했습니다: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    /**
     * 승인된 기관 목록 조회
     */
    @GetMapping("/organs")
    public ResponseEntity<?> getApprovedOrgans() {
        try {
            List<Organ> organs = organService.findByStatus(OrganStatus.APPROVED);
            
            List<Map<String, Object>> organList = organs.stream()
                    .map(organ -> {
                        Map<String, Object> organDto = new HashMap<>();
                        organDto.put("id", organ.getId());
                        organDto.put("name", organ.getOrgName());
                        organDto.put("username", organ.getUser() != null ? organ.getUser().getUsername() : null);
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
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    /**
     * 기부 승인
     */
    @PostMapping("/{id}/approve")
    public ResponseEntity<Map<String, Object>> approveDonation(@PathVariable Long id) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            donationService.approveDonation(id);
            response.put("success", true);
            response.put("message", "기부가 승인되었습니다.");
            return ResponseEntity.ok(response);
        } catch (IllegalStateException | IllegalArgumentException e) {
            log.error("기부 승인 오류", e);
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        } catch (Exception e) {
            log.error("기부 승인 오류", e);
            response.put("success", false);
            response.put("message", "기부 승인 중 오류가 발생했습니다: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    /**
     * 기부 반려
     */
    @PostMapping("/{id}/reject")
    public ResponseEntity<Map<String, Object>> rejectDonation(
            @PathVariable Long id,
            @RequestBody(required = false) Map<String, String> requestBody) {
        
        Map<String, Object> response = new HashMap<>();
        
        try {
            String reason = requestBody != null && requestBody.containsKey("reason") 
                    ? requestBody.get("reason") 
                    : "관리자에 의해 반려되었습니다.";
            
            donationService.rejectDonation(id, reason);
            response.put("success", true);
            response.put("message", "기부가 반려되었습니다.");
            return ResponseEntity.ok(response);
        } catch (IllegalStateException | IllegalArgumentException e) {
            log.error("기부 반려 오류", e);
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        } catch (Exception e) {
            log.error("기부 반려 오류", e);
            response.put("success", false);
            response.put("message", "기부 반려 중 오류가 발생했습니다: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    /**
     * 기부 상태를 승인대기로 변경
     */
    @PostMapping("/{id}/reset-to-pending")
    public ResponseEntity<Map<String, Object>> resetDonationToPending(@PathVariable Long id) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            Donation donation = donationService.getDonationById(id);
            if (donation == null) {
                response.put("success", false);
                response.put("message", "기부를 찾을 수 없습니다.");
                return ResponseEntity.badRequest().body(response);
            }
            
            // 상태를 PENDING으로 변경하고 adminDecision도 PENDING으로 변경
            donation.setStatus(DonationStatus.PENDING);
            donation.setAdminDecision(AdminDecision.PENDING);
            donation.setCancelReason(null); // 거절 사유 제거
            
            // 간접 매칭인 경우 기관 할당 해제
            if (donation.getMatchType() == com.rewear.common.enums.MatchType.INDIRECT) {
                donation.setOrgan(null);
            }
            
            donationRepository.save(donation);
            
            response.put("success", true);
            response.put("message", "기부 상태가 승인대기로 변경되었습니다.");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("기부 상태 변경 오류", e);
            response.put("success", false);
            response.put("message", "기부 상태 변경 중 오류가 발생했습니다: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    /**
     * 기관 할당
     */
    @PostMapping("/{id}/assign")
    public ResponseEntity<Map<String, Object>> assignDonationToOrgan(
            @PathVariable Long id,
            @RequestBody Map<String, Object> requestBody) {
        
        Map<String, Object> response = new HashMap<>();
        
        try {
            Long organId = null;
            if (requestBody.containsKey("organId")) {
                Object organIdObj = requestBody.get("organId");
                if (organIdObj instanceof Number) {
                    organId = ((Number) organIdObj).longValue();
                } else if (organIdObj instanceof String) {
                    organId = Long.parseLong((String) organIdObj);
                }
            }
            
            if (organId == null) {
                response.put("success", false);
                response.put("message", "기관 ID가 필요합니다.");
                return ResponseEntity.badRequest().body(response);
            }
            
            Donation donation = donationService.getDonationById(id);
            if (donation.getMatchType() != MatchType.INDIRECT) {
                response.put("success", false);
                response.put("message", "간접 매칭 요청이 아닌 기부입니다.");
                return ResponseEntity.badRequest().body(response);
            }
            
            Organ organ = organService.findById(organId)
                    .filter(o -> o.getStatus() == OrganStatus.APPROVED)
                    .orElseThrow(() -> new IllegalArgumentException("유효한 기관을 선택해주세요."));
            
            // 기관 할당만 수행 (택배 정보는 별도 페이지에서 입력)
            donationService.assignDonationToOrgan(id, organ, null, null);
            response.put("success", true);
            response.put("message", "선택한 기관으로 기부를 할당했습니다. 이제 매칭 승인을 진행해주세요.");
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            log.error("기관 할당 오류", e);
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        } catch (Exception e) {
            log.error("기관 할당 오류", e);
            response.put("success", false);
            response.put("message", "기관 할당 중 오류가 발생했습니다: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    /**
     * Donation 엔티티를 Front의 AdminDonationDto로 변환
     */
    private Map<String, Object> convertToAdminDonationDto(Donation donation) {
        Map<String, Object> dto = new HashMap<>();
        
        dto.put("id", donation.getId());
        dto.put("owner", donation.getDonor() != null ? donation.getDonor().getUsername() : null);
        dto.put("ownerName", donation.getDonor() != null ? 
                (donation.getDonor().getName() != null ? donation.getDonor().getName() : donation.getDonor().getUsername()) : null);
        
        // 물품 정보
        if (donation.getDonationItem() != null) {
            dto.put("name", donation.getDonationItem().getDetailCategory() != null && !donation.getDonationItem().getDetailCategory().isEmpty()
                    ? donation.getDonationItem().getDetailCategory()
                    : (donation.getDonationItem().getMainCategory() != null ? donation.getDonationItem().getMainCategory().name() : "등록한 기부 물품"));
            dto.put("items", donation.getDonationItem().getDetailCategory() != null && !donation.getDonationItem().getDetailCategory().isEmpty()
                    ? donation.getDonationItem().getDetailCategory()
                    : (donation.getDonationItem().getMainCategory() != null ? donation.getDonationItem().getMainCategory().name() : "기부 물품"));
            dto.put("itemDescription", donation.getDonationItem().getDescription());
            
            // 이미지 URL 처리 (imageUrls는 쉼표로 구분된 String)
            List<Map<String, String>> images = new java.util.ArrayList<>();
            if (donation.getDonationItem().getImageUrls() != null && !donation.getDonationItem().getImageUrls().isEmpty()) {
                log.info("기부 ID: {} - imageUrls 값: {}", donation.getId(), donation.getDonationItem().getImageUrls());
                String[] urlArray = donation.getDonationItem().getImageUrls().split(",");
                for (String url : urlArray) {
                    String trimmedUrl = url.trim();
                    if (!trimmedUrl.isEmpty()) {
                        // 파일명만 추출 (이미 /uploads/가 포함되어 있을 수 있음)
                        String filename = trimmedUrl;
                        if (trimmedUrl.contains("/")) {
                            filename = trimmedUrl.substring(trimmedUrl.lastIndexOf("/") + 1);
                        }
                        
                        // 이미지 파일 존재 여부 확인
                        Path imagePath = Paths.get(uploadDir, filename);
                        boolean fileExists = Files.exists(imagePath);
                        
                        if (fileExists) {
                            // 이미 /uploads/로 시작하지 않으면 추가
                            String fullUrl = trimmedUrl.startsWith("/uploads/") ? trimmedUrl : "/uploads/" + filename;
                            log.info("기부 ID: {} - 이미지 파일 존재: {} -> {}", donation.getId(), filename, fullUrl);
                            Map<String, String> imageMap = new HashMap<>();
                            imageMap.put("url", fullUrl);
                            imageMap.put("dataUrl", fullUrl);
                            images.add(imageMap);
                        } else {
                            log.warn("기부 ID: {} - 이미지 파일이 존재하지 않음: {} (경로: {})", 
                                donation.getId(), filename, imagePath.toAbsolutePath());
                        }
                    }
                }
            } else if (donation.getDonationItem().getImageUrl() != null && !donation.getDonationItem().getImageUrl().isEmpty()) {
                log.info("기부 ID: {} - imageUrl 값: {}", donation.getId(), donation.getDonationItem().getImageUrl());
                
                // 파일명만 추출
                String filename = donation.getDonationItem().getImageUrl();
                if (filename.contains("/")) {
                    filename = filename.substring(filename.lastIndexOf("/") + 1);
                }
                
                // 이미지 파일 존재 여부 확인
                Path imagePath = Paths.get(uploadDir, filename);
                boolean fileExists = Files.exists(imagePath);
                
                if (fileExists) {
                    // 이미 /uploads/로 시작하지 않으면 추가
                    String fullUrl = donation.getDonationItem().getImageUrl().startsWith("/uploads/") 
                        ? donation.getDonationItem().getImageUrl() 
                        : "/uploads/" + filename;
                    log.info("기부 ID: {} - 이미지 파일 존재: {} -> {}", donation.getId(), filename, fullUrl);
                    Map<String, String> imageMap = new HashMap<>();
                    imageMap.put("url", fullUrl);
                    imageMap.put("dataUrl", fullUrl);
                    images.add(imageMap);
                } else {
                    log.warn("기부 ID: {} - 이미지 파일이 존재하지 않음: {} (경로: {})", 
                        donation.getId(), filename, imagePath.toAbsolutePath());
                }
            } else {
                log.warn("기부 ID: {} - 이미지 URL이 없습니다. imageUrl: {}, imageUrls: {}", 
                    donation.getId(), 
                    donation.getDonationItem().getImageUrl(), 
                    donation.getDonationItem().getImageUrls());
            }
            dto.put("images", images);
            log.info("기부 ID: {} - 최종 이미지 개수: {} (파일 존재하는 이미지만 포함)", donation.getId(), images.size());
        } else {
            dto.put("name", "등록한 기부 물품");
            dto.put("items", "기부 물품");
            dto.put("itemDescription", null);
            dto.put("images", List.of());
        }
        
        // 기부 방법
        dto.put("donationMethod", donation.getMatchType() == MatchType.DIRECT ? "직접 매칭" : "자동 매칭");
        dto.put("donationOrganizationId", donation.getOrgan() != null ? donation.getOrgan().getId() : null);
        dto.put("donationOrganization", donation.getOrgan() != null ? donation.getOrgan().getOrgName() : null);
        
        // 상태 변환
        String frontStatus = DonationStatusConverter.convertToFrontStatus(donation);
        dto.put("status", frontStatus);
        
        // 매칭 정보
        String matchingInfo = DonationStatusConverter.generateMatchingInfo(donation, frontStatus);
        dto.put("matchingInfo", matchingInfo);
        
        // 기관 정보
        if (donation.getOrgan() != null) {
            dto.put("pendingOrganization", donation.getOrgan().getOrgName());
            dto.put("matchedOrganization", frontStatus.equals("매칭됨") ? donation.getOrgan().getOrgName() : null);
            // 기관이 승인한 경우 (COMPLETED 상태) 표시
            dto.put("organApproved", donation.getStatus() == DonationStatus.COMPLETED);
        } else {
            dto.put("pendingOrganization", null);
            dto.put("matchedOrganization", null);
            dto.put("organApproved", false);
        }
        
        // 반려 사유
        dto.put("rejectionReason", donation.getCancelReason());
        
        // 익명 여부
        dto.put("isAnonymous", donation.getIsAnonymous() != null ? donation.getIsAnonymous() : false);
        
        // 배송 방법 (Donation 엔티티에서 직접 가져오기)
        if (donation.getDeliveryMethod() != null) {
            dto.put("deliveryMethod", donation.getDeliveryMethod() == com.rewear.common.enums.DeliveryMethod.PARCEL_DELIVERY ? "택배 배송" : "직접 배송");
        } else {
            dto.put("deliveryMethod", null);
        }
        
        // 연락처, 희망일, 메모 (Donation 엔티티에서 가져오기)
        dto.put("contact", donation.getContact());
        dto.put("desiredDate", donation.getDesiredDate() != null ? donation.getDesiredDate().toString() : null);
        dto.put("memo", donation.getMemo());
        
        // 배송 정보 ID (택배 정보 입력 시 사용)
        if (donation.getDelivery() != null) {
            dto.put("deliveryId", donation.getDelivery().getId());
            dto.put("carrier", donation.getDelivery().getCarrier());
            dto.put("trackingNumber", donation.getDelivery().getTrackingNumber());
        } else {
            dto.put("deliveryId", null);
            dto.put("carrier", null);
            dto.put("trackingNumber", null);
        }
        
        return dto;
    }
}

