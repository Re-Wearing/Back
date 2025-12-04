package com.rewear.donation.controller;

import com.rewear.common.enums.MatchType;
import com.rewear.common.enums.OrganStatus;
import com.rewear.donation.DonationForm;
import com.rewear.donation.DonationItemForm;
import com.rewear.donation.dto.DonationApplyRequest;
import com.rewear.donation.dto.DonationResponse;
import com.rewear.donation.entity.Donation;
import com.rewear.donation.service.DonationService;
import com.rewear.donation.util.DonationImageHelper;
import com.rewear.organ.entity.Organ;
import com.rewear.organ.service.OrganService;
import com.rewear.user.details.CustomUserDetails;
import com.rewear.user.entity.User;
import com.rewear.user.service.UserServiceImpl;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.io.IOException;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/donations")
@RequiredArgsConstructor
public class DonationApiController {

    private final DonationService donationService;
    private final UserServiceImpl userService;
    private final OrganService organService;

    @Value("${app.upload.dir:uploads}")
    private String uploadDir;

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<?> createDonation(
            @AuthenticationPrincipal CustomUserDetails principal,
            @Valid DonationApplyRequest request) {

        if (principal == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("ok", false, "message", "로그인이 필요합니다."));
        }

        try {
            DonationItemForm itemForm = request.toItemForm();
            DonationForm donationForm = request.toDonationForm();

            DonationImageHelper.persistUploadedImages(itemForm, uploadDir);

            if (itemForm.getImageUrl() == null) {
                return ResponseEntity.badRequest()
                        .body(Map.of("ok", false, "message", "기부 물품 이미지를 최소 1개 이상 업로드해주세요."));
            }

            User donor = userService.findByUsername(principal.getUsername())
                    .orElseThrow(() -> new IllegalStateException("사용자를 찾을 수 없습니다."));

            Organ organ = null;
            if (donationForm.getMatchType() == MatchType.DIRECT) {
                if (donationForm.getOrganId() == null) {
                    return ResponseEntity.badRequest()
                            .body(Map.of("ok", false, "message", "직접 매칭 시 희망 기관을 선택해주세요."));
                }
                organ = organService.findById(donationForm.getOrganId())
                        .filter(o -> o.getStatus() == OrganStatus.APPROVED)
                        .orElse(null);
                if (organ == null) {
                    return ResponseEntity.badRequest()
                            .body(Map.of("ok", false, "message", "선택한 기관을 찾을 수 없습니다."));
                }
            } else {
                donationForm.setOrganId(null);
            }

            Donation donation = donationService.createDonation(donor, donationForm, itemForm, organ);
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(Map.of("ok", true, "donation", DonationResponse.from(donation)));
        } catch (IOException e) {
            log.error("기부 신청 중 이미지 저장 실패", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("ok", false, "message", "이미지를 저장하는 중 오류가 발생했습니다."));
        } catch (IllegalArgumentException | IllegalStateException e) {
            log.warn("기부 신청 실패: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("ok", false, "message", e.getMessage()));
        } catch (Exception e) {
            log.error("기부 신청 처리 중 오류", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("ok", false, "message", "기부 신청 중 오류가 발생했습니다."));
        }
    }
}

