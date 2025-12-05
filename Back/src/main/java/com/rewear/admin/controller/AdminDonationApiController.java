package com.rewear.admin.controller;

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
    
    @Value("${app.upload.dir:uploads}")
    private String uploadDir;

    /**
     * 승인 대기 기부 목록 조회
     */
    @GetMapping("/pending")
    public ResponseEntity<?> getPendingDonations() {
        try {
            List<Donation> donations = donationService.getDonationsByStatus(DonationStatus.PENDING);
            
            List<Map<String, Object>> donationList = donations.stream()
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
     * 자동 매칭 대기 기부 목록 조회
     */
    @GetMapping("/auto-match")
    public ResponseEntity<?> getAutoMatchDonations() {
        try {
            List<Donation> donations = donationService.getDonationsByStatus(DonationStatus.IN_PROGRESS).stream()
                    .filter(d -> d.getMatchType() == MatchType.INDIRECT && d.getOrgan() == null)
                    .collect(Collectors.toList());
            
            List<Map<String, Object>> donationList = donations.stream()
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
            
            donationService.assignDonationToOrgan(id, organ);
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
        } else {
            dto.put("pendingOrganization", null);
            dto.put("matchedOrganization", null);
        }
        
        // 반려 사유
        dto.put("rejectionReason", donation.getCancelReason());
        
        // 익명 여부
        dto.put("isAnonymous", donation.getIsAnonymous() != null ? donation.getIsAnonymous() : false);
        
        // 기타 정보 (Delivery 정보가 있다면)
        if (donation.getDelivery() != null) {
            dto.put("deliveryMethod", donation.getDelivery().getCarrier() != null ? "택배 배송" : "직접 배송");
        } else {
            dto.put("deliveryMethod", null);
        }
        
        // 메모, 연락처, 희망일 등은 Donation 엔티티에 없을 수 있으므로 null 처리
        dto.put("memo", null);
        dto.put("contact", null);
        dto.put("desiredDate", null);
        
        return dto;
    }
}

