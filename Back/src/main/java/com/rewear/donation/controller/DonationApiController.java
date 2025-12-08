package com.rewear.donation.controller;

import com.rewear.common.enums.MatchType;
import com.rewear.delivery.service.DeliveryService;
import com.rewear.donation.DonationForm;
import com.rewear.donation.DonationItemForm;
import com.rewear.donation.dto.DonationRequestDto;
import com.rewear.donation.dto.DonationStatusResponseDto;
import com.rewear.donation.entity.Donation;
import com.rewear.donation.service.DonationService;
import com.rewear.donation.util.DonationConverter;
import com.rewear.donation.util.DonationStatusConverter;
import com.rewear.organ.entity.Organ;
import com.rewear.organ.repository.OrganRepository;
import com.rewear.user.details.CustomUserDetails;
import com.rewear.user.entity.User;
import com.rewear.user.service.UserServiceImpl;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@RestController
@RequestMapping("/api/donations")
@RequiredArgsConstructor
public class DonationApiController {

    private final DonationService donationService;
    private final OrganRepository organRepository;
    private final UserServiceImpl userService;
    private final DeliveryService deliveryService;

    @Value("${app.upload.dir:uploads}")
    private String uploadDir;

    /**
     * REST API: Front의 기부 신청 방식에 맞춘 엔드포인트
     */
    @PostMapping
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<Map<String, Object>> createDonationApi(
            @AuthenticationPrincipal CustomUserDetails principal,
            @Valid @RequestBody DonationRequestDto requestDto) {
        
        Map<String, Object> response = new HashMap<>();
        
        try {
            // 요청 데이터 로깅 (디버깅용)
            log.info("기부 신청 API - 요청 데이터: itemType={}, itemDetail={}, itemSize={}, itemCondition={}, itemDescription={}, donationMethod={}, donationOrganizationId={}, images={}",
                    requestDto.getItemType(), requestDto.getItemDetail(), requestDto.getItemSize(), 
                    requestDto.getItemCondition(), requestDto.getItemDescription(), 
                    requestDto.getDonationMethod(), requestDto.getDonationOrganizationId(),
                    requestDto.getImages() != null ? requestDto.getImages().size() : 0);
            // 사용자 조회
            User donor = userService.findByUsername(principal.getUsername())
                    .orElseThrow(() -> new IllegalStateException("사용자를 찾을 수 없습니다."));
            
            // 직접 매칭인 경우 기관 조회
            Organ organ = null;
            MatchType matchType = DonationConverter.convertDonationMethodToMatchType(requestDto.getDonationMethod());
            if (matchType == MatchType.DIRECT) {
                if (requestDto.getDonationOrganizationId() == null) {
                    response.put("success", false);
                    response.put("message", "직접 매칭 시 희망 기관을 선택해주세요.");
                    return ResponseEntity.badRequest().body(response);
                }
                organ = organRepository.findById(requestDto.getDonationOrganizationId())
                        .orElseThrow(() -> new IllegalStateException("선택한 기관을 찾을 수 없습니다."));
            }
            
            // 이미지 처리: base64 또는 이미 업로드된 파일명
            List<String> savedImageUrls = new ArrayList<>();
            if (requestDto.getImages() != null && !requestDto.getImages().isEmpty()) {
                for (String imageData : requestDto.getImages()) {
                    try {
                        String imageUrl;
                        // 이미 업로드된 파일명인지 확인 (UUID 형식 또는 파일명 형식)
                        if (isAlreadyUploadedFileName(imageData)) {
                            // 이미 업로드된 파일명이면 /uploads/ 접두사 제거하고 파일명만 사용
                            if (imageData.startsWith("/uploads/")) {
                                imageUrl = imageData.substring("/uploads/".length());
                            } else {
                                imageUrl = imageData;
                            }
                            log.info("기부 신청 API - 이미 업로드된 이미지 사용: {}", imageUrl);
                        } else {
                            // base64 이미지면 디코딩해서 저장
                            imageUrl = saveBase64Image(imageData);
                            log.info("기부 신청 API - base64 이미지 저장 완료: {}", imageUrl);
                        }
                        savedImageUrls.add(imageUrl);
                    } catch (IOException e) {
                        log.error("이미지 저장 실패", e);
                        response.put("success", false);
                        response.put("message", "이미지 저장에 실패했습니다: " + e.getMessage());
                        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
                    } catch (IllegalArgumentException e) {
                        log.error("이미지 처리 실패", e);
                        response.put("success", false);
                        response.put("message", "이미지 처리에 실패했습니다: " + e.getMessage());
                        return ResponseEntity.badRequest().body(response);
                    }
                }
            }
            
            // DonationItemForm 생성
            DonationItemForm itemForm = new DonationItemForm();
            itemForm.setGenderType(DonationConverter.convertItemTypeToGenderType(requestDto.getItemType()));
            itemForm.setMainCategory(DonationConverter.convertItemDetailToClothType(requestDto.getItemDetail()));
            itemForm.setDetailCategory(requestDto.getItemDetail());
            itemForm.setSize(DonationConverter.convertItemSizeToSize(requestDto.getItemSize()));
            itemForm.setQuantity(requestDto.getQuantity() != null ? requestDto.getQuantity() : 1);
            // quantity는 프론트엔드에서 보내지 않으므로 기본값 1 사용 (필요시 requestDto에 추가 가능)
            
            // 물품 상태 정보를 description에 포함
            String description = requestDto.getItemDescription();
            if (requestDto.getItemCondition() != null && !requestDto.getItemCondition().isEmpty()) {
                description = String.format("[상태: %s] %s", requestDto.getItemCondition(), description);
            }
            itemForm.setDescription(description);
            
            // 이미지 URL 설정
            if (!savedImageUrls.isEmpty()) {
                itemForm.setImageUrls(savedImageUrls);
                itemForm.setImageUrl(savedImageUrls.get(0));
            }
            
            // DonationForm 생성
            DonationForm form = new DonationForm();
            form.setMatchType(matchType);
            form.setOrganId(requestDto.getDonationOrganizationId());
            form.setDeliveryMethod(DonationConverter.convertDeliveryMethod(requestDto.getDeliveryMethod()));
            form.setIsAnonymous(requestDto.getIsAnonymous());
            form.setContact(requestDto.getContact());
            
            // desiredDate 파싱 (String -> LocalDate)
            if (requestDto.getDesiredDate() != null && !requestDto.getDesiredDate().isEmpty()) {
                try {
                    form.setDesiredDate(java.time.LocalDate.parse(requestDto.getDesiredDate()));
                } catch (Exception e) {
                    log.warn("희망일 파싱 실패: {}", requestDto.getDesiredDate(), e);
                }
            }
            
            form.setMemo(requestDto.getMemo());
            
            // 기부 생성
            Donation donation = donationService.createDonation(donor, form, itemForm, organ);
            
            response.put("success", true);
            response.put("message", "기부 신청이 완료되었습니다.");
            response.put("donationId", donation.getId());
            
            return ResponseEntity.ok(response);
            
        } catch (IllegalArgumentException e) {
            log.error("기부 신청 API - 잘못된 요청", e);
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        } catch (Exception e) {
            log.error("기부 신청 API - 오류 발생", e);
            response.put("success", false);
            response.put("message", "기부 신청 중 오류가 발생했습니다: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }
    
    /**
     * REST API: 내 기부 관리 데이터 조회
     */
    @GetMapping("/status")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<?> getDonationStatus(
            @AuthenticationPrincipal CustomUserDetails principal) {
        
        try {
            // 사용자 조회
            User user = userService.findByUsername(principal.getUsername())
                    .orElseThrow(() -> new IllegalStateException("사용자를 찾을 수 없습니다."));
            
            log.info("기부 상태 조회 API - 사용자: {}", user.getUsername());
            
            // 사용자의 모든 기부 조회
            List<Donation> donations = donationService.getDonationsByUser(user);
            log.info("기부 상태 조회 API - 조회된 기부 개수: {}", donations.size());
            
            // 각 기부에 대한 배송 정보 로드
            donations.forEach(donation -> {
                deliveryService.getDeliveryByDonation(donation).ifPresent(delivery -> {
                    donation.setDelivery(delivery);
                });
                log.info("기부 ID: {}, 상태: {}, DonationItem: {}", 
                    donation.getId(), 
                    donation.getStatus(), 
                    donation.getDonationItem() != null ? "존재" : "null");
            });
            
            // ApprovalItemDto 리스트 생성 (COMPLETED 상태는 제외 - completedDonations에만 포함)
            log.info("필터링 전 - 전체 기부 개수: {}", donations.size());
            donations.forEach(donation -> {
                log.info("필터링 전 - 기부 ID: {}, 상태: {}", donation.getId(), donation.getStatus());
            });
            
            List<DonationStatusResponseDto.ApprovalItemDto> approvalItems = donations.stream()
                    .filter(donation -> {
                        boolean shouldInclude = donation.getStatus() != com.rewear.common.enums.DonationStatus.COMPLETED;
                        if (!shouldInclude) {
                            log.info("필터링됨 - 기부 ID: {}, 상태: {} (COMPLETED이므로 제외)", donation.getId(), donation.getStatus());
                        }
                        return shouldInclude;
                    })
                    .map(donation -> {
                        log.info("기부 변환 시작 - ID: {}, DonationItem null 여부: {}", 
                            donation.getId(), donation.getDonationItem() == null);
                        
                        String frontStatus = DonationStatusConverter.convertToFrontStatus(donation);
                        String matchingInfo = DonationStatusConverter.generateMatchingInfo(donation, frontStatus);
                        
                        // 물품명 생성
                        String itemName = "등록한 기부 물품";
                        if (donation.getDonationItem() != null) {
                            String detailCategory = donation.getDonationItem().getDetailCategory();
                            if (detailCategory != null && !detailCategory.isEmpty()) {
                                itemName = detailCategory;
                            } else if (donation.getDonationItem().getMainCategory() != null) {
                                itemName = donation.getDonationItem().getMainCategory().name();
                            }
                            log.info("기부 ID: {} - 물품명: {}", donation.getId(), itemName);
                        } else {
                            log.warn("기부 ID: {} - DonationItem이 null입니다!", donation.getId());
                        }
                        
                        // 카테고리 생성
                        String category = "분류 미지정";
                        if (donation.getDonationItem() != null && donation.getDonationItem().getMainCategory() != null) {
                            category = convertClothTypeToCategory(donation.getDonationItem().getMainCategory());
                        }
                        
                        // 매칭된 기관명
                        String matchedOrg = null;
                        if (donation.getOrgan() != null && frontStatus.equals("매칭됨")) {
                            matchedOrg = donation.getOrgan().getOrgName();
                        }
                        
                        // 참조 코드 생성 (ID 기반)
                        String referenceCode = "REQ-" + donation.getId();
                        
                        DonationStatusResponseDto.ApprovalItemDto item = DonationStatusResponseDto.ApprovalItemDto.builder()
                                .id(donation.getId())
                                .name(itemName)
                                .category(category)
                                .registeredAt(DonationStatusConverter.formatDate(donation.getCreatedAt()))
                                .status(frontStatus)
                                .matchingInfo(matchingInfo)
                                .matchedOrganization(matchedOrg)
                                .referenceCode(referenceCode)
                                .build();
                        
                        log.info("기부 변환 완료 - ID: {}, name: {}, status: {}", 
                            item.getId(), item.getName(), item.getStatus());
                        
                        return item;
                    })
                    .collect(Collectors.toList());
            
            log.info("approvalItems 생성 완료 - 총 {}개", approvalItems.size());
            
            // CompletedDonationDto 리스트 생성 (COMPLETED 상태인 기부만)
            List<DonationStatusResponseDto.CompletedDonationDto> completedDonations = donations.stream()
                    .filter(donation -> donation.getStatus() == com.rewear.common.enums.DonationStatus.COMPLETED)
                    .map(donation -> {
                        // 기부 내용 생성
                        String items = "기부 물품";
                        if (donation.getDonationItem() != null) {
                            String detailCategory = donation.getDonationItem().getDetailCategory();
                            if (detailCategory != null && !detailCategory.isEmpty()) {
                                items = detailCategory;
                            } else {
                                items = donation.getDonationItem().getMainCategory().name();
                            }
                        }
                        
                        // 수혜 기관
                        String organization = "자동 매칭";
                        if (donation.getOrgan() != null) {
                            organization = donation.getOrgan().getOrgName();
                        }
                        
                        return DonationStatusResponseDto.CompletedDonationDto.builder()
                                .id(donation.getId())
                                .date(DonationStatusConverter.formatDate(donation.getCreatedAt()))
                                .items(items)
                                .organization(organization)
                                .status("완료")
                                .build();
                    })
                    .collect(Collectors.toList());
            
            // 상태별 개수 계산
            DonationStatusResponseDto.StatusCountsDto statusCounts = DonationStatusResponseDto.StatusCountsDto.builder()
                    .승인대기((int) approvalItems.stream().filter(item -> item.getStatus().equals("승인대기")).count())
                    .매칭대기((int) approvalItems.stream().filter(item -> item.getStatus().equals("매칭대기")).count())
                    .매칭됨((int) approvalItems.stream().filter(item -> item.getStatus().equals("매칭됨")).count())
                    .거절됨((int) approvalItems.stream().filter(item -> item.getStatus().equals("거절됨")).count())
                    .배송대기((int) approvalItems.stream().filter(item -> item.getStatus().equals("배송대기")).count())
                    .취소됨((int) approvalItems.stream().filter(item -> item.getStatus().equals("취소됨")).count())
                    .build();
            
            log.info("기부 상태 조회 API - approvalItems 개수: {}, completedDonations 개수: {}", 
                approvalItems.size(), completedDonations.size());
            
            DonationStatusResponseDto response = DonationStatusResponseDto.builder()
                    .approvalItems(approvalItems)
                    .completedDonations(completedDonations)
                    .statusCounts(statusCounts)
                    .build();
            
            log.info("기부 상태 조회 API - 응답 생성 완료");
            return ResponseEntity.ok(response);
            
        } catch (IllegalStateException e) {
            log.error("기부 상태 조회 API - 상태 오류", e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", true);
            errorResponse.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
        } catch (Exception e) {
            log.error("기부 상태 조회 API - 오류 발생", e);
            e.printStackTrace();
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", true);
            errorResponse.put("message", "기부 상태 조회 중 오류가 발생했습니다: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }
    
    /**
     * REST API: 기부 상세 정보 조회
     */
    @GetMapping("/{id}")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<Map<String, Object>> getDonationDetail(
            @AuthenticationPrincipal CustomUserDetails principal,
            @PathVariable Long id) {
        
        Map<String, Object> response = new HashMap<>();
        
        try {
            // 사용자 조회
            User user = userService.findByUsername(principal.getUsername())
                    .orElseThrow(() -> new IllegalStateException("사용자를 찾을 수 없습니다."));
            
            // 기부 조회
            Donation donation = donationService.getDonationById(id);
            if (donation == null) {
                response.put("success", false);
                response.put("message", "기부를 찾을 수 없습니다.");
                return ResponseEntity.notFound().build();
            }
            
            // 본인의 기부인지 확인
            if (!donation.getDonor().getId().equals(user.getId())) {
                response.put("success", false);
                response.put("message", "본인의 기부만 조회할 수 있습니다.");
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(response);
            }
            
            // 기부 상세 정보 구성
            Map<String, Object> detail = new HashMap<>();
            detail.put("id", donation.getId());
            detail.put("status", DonationStatusConverter.convertToFrontStatus(donation));
            detail.put("createdAt", DonationStatusConverter.formatDate(donation.getCreatedAt()));
            detail.put("matchType", donation.getMatchType() != null ? donation.getMatchType().name() : null);
            
            // 물품 정보
            if (donation.getDonationItem() != null) {
                Map<String, Object> item = new HashMap<>();
                item.put("name", donation.getDonationItem().getDetailCategory() != null 
                    ? donation.getDonationItem().getDetailCategory() 
                    : (donation.getDonationItem().getMainCategory() != null 
                        ? donation.getDonationItem().getMainCategory().name() 
                        : "등록한 기부 물품"));
                // 카테고리는 프론트엔드에서 표시하지 않으므로 제거
                // item.put("category", convertClothTypeToCategory(donation.getDonationItem().getMainCategory()));
                item.put("size", donation.getDonationItem().getSize() != null ? donation.getDonationItem().getSize().name() : null);
                item.put("genderType", donation.getDonationItem().getGenderType() != null ? donation.getDonationItem().getGenderType().name() : null);
                item.put("description", donation.getDonationItem().getDescription());
                String singleImageUrl = donation.getDonationItem().getImageUrl();
                String multipleImageUrls = donation.getDonationItem().getImageUrls();
                
                log.info("기부 상세 조회 - 이미지 URL 정보: imageUrl={}, imageUrls={}", singleImageUrl, multipleImageUrls);
                
                item.put("imageUrl", singleImageUrl);
                
                // 이미지 URL 리스트 (여러 이미지 처리)
                List<String> imageUrls = new ArrayList<>();
                if (multipleImageUrls != null && !multipleImageUrls.isEmpty()) {
                    // 쉼표로 구분된 이미지 URL 파싱
                    String[] urlArray = multipleImageUrls.split(",");
                    for (String url : urlArray) {
                        String trimmedUrl = url.trim();
                        if (!trimmedUrl.isEmpty()) {
                            imageUrls.add(trimmedUrl);
                        }
                    }
                    log.info("기부 상세 조회 - 파싱된 이미지 URL 개수: {}", imageUrls.size());
                } else if (singleImageUrl != null && !singleImageUrl.isEmpty()) {
                    // 단일 이미지 URL 사용
                    imageUrls.add(singleImageUrl);
                    log.info("기부 상세 조회 - 단일 이미지 URL 사용: {}", singleImageUrl);
                }
                item.put("imageUrls", imageUrls);
                log.info("기부 상세 조회 - 최종 imageUrls: {}", imageUrls);
                
                detail.put("item", item);
            }
            
            // 기관 정보
            if (donation.getOrgan() != null) {
                Map<String, Object> organ = new HashMap<>();
                organ.put("id", donation.getOrgan().getId());
                organ.put("name", donation.getOrgan().getOrgName());
                detail.put("organization", organ);
            }
            
            // 매칭 정보
            detail.put("matchingInfo", DonationStatusConverter.generateMatchingInfo(donation, DonationStatusConverter.convertToFrontStatus(donation)));
            
            // 배송 정보
            if (donation.getDelivery() != null) {
                Map<String, Object> delivery = new HashMap<>();
                delivery.put("status", donation.getDelivery().getStatus() != null ? donation.getDelivery().getStatus().name() : null);
                delivery.put("carrier", donation.getDelivery().getCarrier());
                delivery.put("trackingNumber", donation.getDelivery().getTrackingNumber());
                detail.put("delivery", delivery);
            }
            
            response.put("success", true);
            response.put("donation", detail);
            
            return ResponseEntity.ok(response);
            
        } catch (IllegalStateException e) {
            log.error("기부 상세 조회 API - 상태 오류", e);
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        } catch (Exception e) {
            log.error("기부 상세 조회 API - 오류 발생", e);
            response.put("success", false);
            response.put("message", "기부 상세 조회 중 오류가 발생했습니다: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }
    
    /**
     * REST API: 기부 취소
     */
    @PutMapping("/{id}/cancel")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<Map<String, Object>> cancelDonation(
            @AuthenticationPrincipal CustomUserDetails principal,
            @PathVariable Long id) {
        
        Map<String, Object> response = new HashMap<>();
        
        try {
            // 사용자 조회
            User user = userService.findByUsername(principal.getUsername())
                    .orElseThrow(() -> new IllegalStateException("사용자를 찾을 수 없습니다."));
            
            // 기부 조회 및 권한 확인
            Donation donation = donationService.getDonationById(id);
            if (donation == null) {
                response.put("success", false);
                response.put("message", "기부를 찾을 수 없습니다.");
                return ResponseEntity.notFound().build();
            }
            
            // 본인의 기부인지 확인
            if (!donation.getDonor().getId().equals(user.getId())) {
                response.put("success", false);
                response.put("message", "본인의 기부만 취소할 수 있습니다.");
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(response);
            }
            
            // 취소 가능한 상태인지 확인 (승인대기 또는 매칭대기 상태만 취소 가능)
            String frontStatus = DonationStatusConverter.convertToFrontStatus(donation);
            if (!frontStatus.equals("승인대기") && !frontStatus.equals("매칭대기")) {
                response.put("success", false);
                response.put("message", "승인 대기 또는 매칭 대기 상태에서만 취소할 수 있습니다.");
                return ResponseEntity.badRequest().body(response);
            }
            
            // 기부 취소
            donationService.cancelDonation(id, "사용자 요청으로 취소됨");
            
            response.put("success", true);
            response.put("message", "기부 신청이 취소되었습니다.");
            return ResponseEntity.ok(response);
            
        } catch (IllegalStateException e) {
            log.error("기부 취소 API - 잘못된 요청", e);
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        } catch (Exception e) {
            log.error("기부 취소 API - 오류 발생", e);
            response.put("success", false);
            response.put("message", "기부 취소 중 오류가 발생했습니다: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }
    
    /**
     * 이미지가 이미 업로드된 파일명인지 확인
     * /uploads/ 접두사가 있거나, UUID 형식 파일명, 또는 일반 파일명 형식
     */
    private boolean isAlreadyUploadedFileName(String imageData) {
        if (imageData == null || imageData.isEmpty()) {
            return false;
        }
        
        // base64 데이터 URL 형식인지 확인
        if (imageData.startsWith("data:image/")) {
            return false;
        }
        
        // /uploads/ 접두사가 있으면 이미 업로드된 파일
        if (imageData.startsWith("/uploads/")) {
            return true;
        }
        
        // base64 문자열은 보통 매우 길고 (수백~수천 자) 특정 문자만 포함 (A-Z, a-z, 0-9, +, /, =)
        // 파일명은 상대적으로 짧고 (보통 100자 미만) 확장자를 가짐
        if (imageData.length() < 200 && imageData.contains(".")) {
            // base64 디코딩 시도해서 실패하면 파일명으로 간주
            try {
                // base64 데이터 URL 형식인지 확인
                String testData = imageData;
                if (imageData.contains(",")) {
                    testData = imageData.split(",")[1];
                }
                // base64 디코딩 시도
                java.util.Base64.getDecoder().decode(testData);
                return false; // 디코딩 성공하면 base64
            } catch (IllegalArgumentException e) {
                return true; // 디코딩 실패하면 파일명으로 간주
            }
        }
        
        return false;
    }
    
    /**
     * base64 이미지를 파일로 저장
     */
    private String saveBase64Image(String base64Image) throws IOException {
        if (base64Image == null || base64Image.isEmpty()) {
            throw new IllegalArgumentException("이미지 데이터가 없습니다.");
        }
        
        // base64 데이터 URL 파싱 (data:image/jpeg;base64,/9j/4AAQ... 형식)
        String base64Data = base64Image;
        String extension = ".jpg"; // 기본 확장자
        
        if (base64Image.contains(",")) {
            String[] parts = base64Image.split(",");
            base64Data = parts[1];
            
            // MIME 타입에서 확장자 추출
            String mimeType = parts[0];
            if (mimeType.contains("image/png")) {
                extension = ".png";
            } else if (mimeType.contains("image/jpeg") || mimeType.contains("image/jpg")) {
                extension = ".jpg";
            } else if (mimeType.contains("image/gif")) {
                extension = ".gif";
            } else if (mimeType.contains("image/webp")) {
                extension = ".webp";
            }
        }
        
        // base64 디코딩
        byte[] imageBytes = java.util.Base64.getDecoder().decode(base64Data);
        
        // 파일 저장
        Path uploadPath = Paths.get(uploadDir);
        if (!Files.exists(uploadPath)) {
            Files.createDirectories(uploadPath);
        }
        
        String filename = UUID.randomUUID().toString() + extension;
        Path filePath = uploadPath.resolve(filename);
        Files.write(filePath, imageBytes);
        
        return filename;
    }
    
    /**
     * ClothType을 Front의 카테고리 문자열로 변환
     */
    private String convertClothTypeToCategory(com.rewear.common.enums.ClothType clothType) {
        if (clothType == null) {
            return "기타";
        }
        
        return switch (clothType) {
            case TOP -> "상의";
            case BOTTOM -> "하의";
            case OUTERWEAR -> "아우터";
            case SHOES -> "신발";
            case ACCESSORY -> "액세서리";
            case UNDERWEAR -> "속옷";
            case ETC -> "기타";
        };
    }
}

