package com.rewear.donation.util;

import com.rewear.common.enums.AdminDecision;
import com.rewear.common.enums.DonationStatus;
import com.rewear.donation.entity.Donation;

/**
 * Back의 DonationStatus를 Front의 상태 문자열로 변환하는 유틸리티
 */
public class DonationStatusConverter {
    
    /**
     * Donation 엔티티의 상태를 Front의 상태 문자열로 변환
     * Front 상태: 승인대기, 매칭대기, 매칭됨, 거절됨, 배송대기, 취소됨
     */
    public static String convertToFrontStatus(Donation donation) {
        if (donation == null) {
            return "승인대기";
        }
        
        DonationStatus status = donation.getStatus();
        AdminDecision adminDecision = donation.getAdminDecision();
        
        // 취소됨
        if (status == DonationStatus.CANCELLED) {
            return "취소됨";
        }
        
        // 거절됨 (관리자가 거절한 경우)
        if (adminDecision == AdminDecision.REJECTED) {
            return "거절됨";
        }
        
        // 배송대기 (배송이 시작되었지만 아직 완료되지 않은 경우)
        if (status == DonationStatus.SHIPPED) {
            return "배송대기";
        }
        
        // 매칭됨 (기관이 최종 승인한 경우 - COMPLETED 상태로 변경됨)
        // IN_PROGRESS 상태는 관리자가 승인한 상태이므로 매칭대기로 표시
        // (직접 매칭인 경우 organ이 할당되어 있어도 기관의 최종 승인을 기다리는 상태)
        
        // 매칭대기 (관리자가 승인했고 진행 중인 경우 - 기관의 최종 승인 대기)
        if (status == DonationStatus.IN_PROGRESS) {
            return "매칭대기";
        }
        
        // 승인대기 (관리자가 아직 승인하지 않은 경우)
        if (status == DonationStatus.PENDING || adminDecision == AdminDecision.PENDING) {
            return "승인대기";
        }
        
        // COMPLETED 상태는 approvalItems에 포함되지 않음 (completedDonations에만 포함)
        // 하지만 혹시 모를 경우를 대비해 "완료" 반환 (실제로는 필터링됨)
        if (status == DonationStatus.COMPLETED) {
            return "완료";
        }
        
        // 기본값
        return "승인대기";
    }
    
    /**
     * 상태에 따른 매칭 정보 설명 생성
     */
    public static String generateMatchingInfo(Donation donation, String frontStatus) {
        if (donation == null) {
            return "관리자 검토 중입니다.";
        }
        
        switch (frontStatus) {
            case "승인대기":
                return "관리자 검토 중입니다.";
            case "매칭대기":
                if (donation.getMatchType() == com.rewear.common.enums.MatchType.DIRECT && donation.getOrgan() != null) {
                    return donation.getOrgan().getOrgName() + " 기관 확인 중입니다.";
                }
                return "기관 매칭을 기다리는 중입니다.";
            case "매칭됨":
                if (donation.getOrgan() != null) {
                    return donation.getOrgan().getOrgName() + "과 연결되었어요.";
                }
                return "기관과 연결되었어요.";
            case "거절됨":
                if (donation.getCancelReason() != null && !donation.getCancelReason().isEmpty()) {
                    return "거절 사유: " + donation.getCancelReason();
                }
                return "사유 확인 후 다시 신청해주세요.";
            case "배송대기":
                return "배송 준비 중입니다.";
            case "취소됨":
                return "기부자가 신청을 취소했습니다.";
            default:
                return "진행 중입니다.";
        }
    }
    
    /**
     * 날짜를 YYYY-MM-DD 형식으로 변환
     */
    public static String formatDate(java.time.LocalDateTime dateTime) {
        if (dateTime == null) {
            return "-";
        }
        return dateTime.toLocalDate().toString();
    }
}

