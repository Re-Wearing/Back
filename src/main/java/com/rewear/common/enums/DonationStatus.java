package com.rewear.common.enums;

public enum DonationStatus {
    PENDING,       // 대기 중 (기부 신청됨)
    IN_PROGRESS,   // 진행 중 (매칭 완료, 처리 중)
    SHIPPED,       // 배송 중
    COMPLETED,     // 완료
    CANCELLED      // 취소됨
}
