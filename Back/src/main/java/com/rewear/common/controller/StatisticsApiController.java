package com.rewear.common.controller;

import com.rewear.common.enums.DonationStatus;
import com.rewear.common.enums.OrganStatus;
import com.rewear.donation.repository.DonationRepository;
import com.rewear.organ.repository.OrganRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/statistics")
@RequiredArgsConstructor
public class StatisticsApiController {

    private final DonationRepository donationRepository;
    private final OrganRepository organRepository;

    /**
     * 공개 통계 정보 조회 API
     * - 기부된 옷 벌 수: COMPLETED 상태의 기부 아이템 개수
     * - 함께하는 기관: APPROVED 상태의 기관 개수
     * - 누적 참여자: 기부를 한 사용자 수 (고유 기부자 수)
     */
    @GetMapping("/public")
    public ResponseEntity<Map<String, Object>> getPublicStatistics() {
        try {
            // 1. 기부된 옷 벌 수: COMPLETED 상태의 기부 아이템 개수
            long completedDonationCount = donationRepository.findByStatus(DonationStatus.COMPLETED).stream()
                    .mapToLong(donation -> {
                        if (donation.getDonationItem() != null && donation.getDonationItem().getQuantity() != null) {
                            return donation.getDonationItem().getQuantity();
                        }
                        return 1L; // quantity가 없으면 1로 계산
                    })
                    .sum();

            // 2. 함께하는 기관: APPROVED 상태의 기관 개수
            long approvedOrganCount = organRepository.findAllByStatus(OrganStatus.APPROVED).size();

            // 3. 누적 참여자: 기부를 한 사용자 수 (고유 기부자 수)
            long uniqueDonorCount = donationRepository.findAll().stream()
                    .filter(donation -> donation.getDonor() != null)
                    .map(donation -> donation.getDonor().getId())
                    .distinct()
                    .count();

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("donationCount", completedDonationCount); // 기부된 옷 벌 수
            response.put("organCount", approvedOrganCount); // 함께하는 기관 수
            response.put("participantCount", uniqueDonorCount); // 누적 참여자 수

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("통계 정보 조회 오류", e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("error", "통계 정보 조회 중 오류가 발생했습니다: " + e.getMessage());
            return ResponseEntity.status(500).body(errorResponse);
        }
    }
}

