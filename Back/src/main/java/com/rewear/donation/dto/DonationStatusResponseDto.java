package com.rewear.donation.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DonationStatusResponseDto {
    
    // 물품 승인 현황 목록
    private List<ApprovalItemDto> approvalItems;
    
    // 완료된 기부 내역 목록
    private List<CompletedDonationDto> completedDonations;
    
    // 상태별 개수
    private StatusCountsDto statusCounts;
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ApprovalItemDto {
        private Long id;
        private String name; // 물품명
        private String category; // 물품 종류
        private String registeredAt; // 등록일 (YYYY-MM-DD 형식)
        private String status; // 상태 (승인대기, 매칭대기, 매칭됨, 거절됨, 배송대기, 취소됨)
        private String matchingInfo; // 매칭 정보 설명
        private String matchedOrganization; // 매칭된 기관명 (null 가능)
        private String referenceCode; // 참조 코드
        private Long deliveryId; // 배송 ID (null 가능)
    }
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CompletedDonationDto {
        private Long id;
        private String date; // 기부 날짜 (YYYY-MM-DD 형식)
        private String items; // 기부 내용
        private String organization; // 수혜 기관
        private String status; // 상태 (완료)
        private Long deliveryId; // 배송 ID (null 가능)
        private String businessNo; // 기관 사업자등록번호 (null 가능)
        private String organAddress; // 기관 주소 (null 가능)
        private String mainCategory; // 기부 물품 메인 카테고리 (null 가능)
        private String detailCategory; // 기부 물품 상세 카테고리 (null 가능)
    }
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class StatusCountsDto {
        private int 승인대기;
        private int 매칭대기;
        private int 매칭됨;
        private int 거절됨;
        private int 배송대기;
        private int 배송중;
        private int 취소됨;
        private int 완료;
    }
}

