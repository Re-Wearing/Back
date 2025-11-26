package com.rewear.admin.service;

import com.rewear.admin.view.PendingOrganVM;
import com.rewear.organ.entity.Organ;
import com.rewear.common.enums.OrganStatus;
import com.rewear.organ.repository.OrganRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AdminOrganQueryService {

    private final OrganRepository organRepository;

    public List<PendingOrganVM> findPendingVMs() {
        return organRepository.findAllByStatusOrderByIdDesc(OrganStatus.PENDING)
                .stream()
                .map(this::toVM)
                .toList();
    }

    private PendingOrganVM toVM(Organ o) {
        return PendingOrganVM.of(
                o.getId(),
                // 엔티티에 있는 실제 필드명으로 맞춰주세요 (orgName/name, businessNo/bizNo 등)
                o.getOrgName(),
                o.getBusinessNo(),
                resolveRequesterUsername(o), // 지금은 null 반환 → 템플릿에서 “(미배정)”
                o.getCreatedAt()             // 없으면 requestedAt 등 실제 필드로 교체
        );
    }

    /**
     * ⚠️ 현재 Organ에 요청자 정보가 없기 때문에 null을 반환합니다.
     * 아래 두 가지 중 하나를 도입한 뒤 주석을 풀어 사용하세요.
     */
    private String resolveRequesterUsername(Organ o) {
        // [옵션 A] 엔티티에 관계 추가 후 사용
        // return o.getRequester() != null ? o.getRequester().getUsername() : null;

        // [옵션 B] JPA Auditing(@CreatedBy) 도입 후 사용
        // return o.getCreatedBy(); // String이나 User 둘 중 설계에 맞게

        // 현재는 표시만 비워두고 템플릿에서 “(미배정)” 처리
        return null;
    }
}
