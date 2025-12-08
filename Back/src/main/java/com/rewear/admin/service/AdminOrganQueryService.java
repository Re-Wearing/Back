package com.rewear.admin.service;

import com.rewear.admin.view.PendingOrganVM;
import com.rewear.organ.entity.Organ;
import com.rewear.common.enums.OrganStatus;
import com.rewear.organ.repository.OrganRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AdminOrganQueryService {

    private final OrganRepository organRepository;

    public List<PendingOrganVM> findPendingVMs() {
        try {
            List<Organ> organs = organRepository.findAllByStatusOrderByIdDescWithUser(OrganStatus.PENDING);
            log.debug("승인 대기 기관 조회 완료 - 개수: {}", organs != null ? organs.size() : 0);
            if (organs == null) {
                return List.of();
            }
            // 1:1 관계이므로 중복이 발생하지 않지만, 안전을 위해 중복 제거
            return organs.stream()
                    .distinct()
                    .map(this::toVM)
                    .toList();
        } catch (Exception e) {
            log.error("승인 대기 기관 조회 실패", e);
            throw e;
        }
    }

    private PendingOrganVM toVM(Organ o) {
        try {
            String username = null;
            String phone = null;
            String email = null;
            String contactName = null;
            
            if (o != null && o.getUser() != null) {
                username = o.getUser().getUsername();
                phone = o.getUser().getPhone();
                email = o.getUser().getEmail();
                contactName = o.getUser().getName();
            }
            
            log.debug("기관 정보 변환 - id: {}, orgName: {}, username: {}, phone: {}, email: {}", 
                    o.getId(), o.getOrgName(), username, phone, email);
            return PendingOrganVM.of(
                    o.getId(),
                    o.getOrgName(),
                    o.getBusinessNo(),
                    username,
                    o.getCreatedAt(),
                    phone,
                    email,
                    contactName
            );
        } catch (Exception e) {
            log.error("기관 정보 변환 실패 - id: {}", o != null ? o.getId() : "null", e);
            throw e;
        }
    }
}
