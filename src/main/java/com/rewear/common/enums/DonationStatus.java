package com.rewear.common.enums;

public enum DonationStatus {
    PENDING,       // 관리자 승인 대기
    REQUESTED,     // 승인 완료 (기관에게 공개됨)
    MATCHED,       // 기관 매칭 완료
    SHIPPED,       // 배송 중
    COMPLETED      // 완료
}
