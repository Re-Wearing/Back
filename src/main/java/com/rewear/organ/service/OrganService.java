package com.rewear.organ.service;

import com.rewear.organ.entity.Organ;
import com.rewear.user.entity.User;

import java.util.List;
import java.util.Optional;

public interface OrganService {

    /** 기관 가입 신청: Organ 레코드를 PENDING으로 생성 */
    Organ createPending(User user, String businessNoDigits, String orgName);

    /** 특정 사용자(기관 역할)의 승인 여부 */
    boolean isApprovedForUserId(Long userId);

    /** 승인/반려/정지 등 상태 변경 */
    void approve(Long organId);
    void reject(Long organId, String reason);   // reason 저장 필드가 없다면 로그만

    /** 조회 헬퍼들 */
    Optional<Organ> findByUserId(Long userId);
    List<Organ> findPendings();
}

