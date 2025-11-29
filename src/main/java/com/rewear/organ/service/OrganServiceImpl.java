package com.rewear.organ.service;

import com.rewear.common.enums.Role;
import com.rewear.organ.entity.Organ;
import com.rewear.common.enums.OrganStatus;
import com.rewear.organ.repository.OrganRepository;
import com.rewear.user.entity.User;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Transactional
public class OrganServiceImpl implements OrganService {

    private final OrganRepository organRepository;

    @Override
    public Organ createPending(User user, String businessNoDigits, String orgName) {
        // --- 방어적 검증 ---
        if (user == null || user.getId() == null) {
            throw new IllegalArgumentException("유효하지 않은 사용자입니다.");
        }
        if (user.getRoles() == null || !user.getRoles().contains(Role.ORGAN)) {
            throw new IllegalStateException("사용자에 ORGAN 권한이 없습니다. roles에 ORGAN을 먼저 부여하세요.");
        }
        if (businessNoDigits == null || businessNoDigits.length() != 10) {
            throw new IllegalArgumentException("사업자번호는 숫자 10자리여야 합니다.");
        }
        if (orgName == null || orgName.isBlank()) {
            throw new IllegalArgumentException("기관명을 입력하세요.");
        }
        if (organRepository.findByUserId(user.getId()).isPresent()) {
            throw new IllegalStateException("이미 기관 신청(또는 등록) 정보가 존재합니다.");
        }
        if (organRepository.existsByBusinessNo(businessNoDigits)) {
            throw new IllegalStateException("이미 등록된 사업자번호입니다.");
        }

        Organ organ = Organ.builder()
                .user(user)
                .businessNo(businessNoDigits)
                .orgName(orgName)
                .status(OrganStatus.PENDING)
                .build();

        return organRepository.save(organ);
    }

    @Override
    public boolean isApprovedForUserId(Long userId) {
        return organRepository.findByUserId(userId)
                .map(o -> o.getStatus() == OrganStatus.APPROVED)
                .orElse(false);
    }

    @Override
    public void approve(Long organId) {
        Organ organ = organRepository.findById(organId)
                .orElseThrow(() -> new IllegalArgumentException("기관 정보가 존재하지 않습니다."));
        organ.setStatus(OrganStatus.APPROVED);
        // 변경감지로 updateAt 갱신됨
    }

    @Override
    public void reject(Long organId, String reason) {
        Organ organ = organRepository.findById(organId)
                .orElseThrow(() -> new IllegalArgumentException("기관 정보가 존재하지 않습니다."));
        organ.setStatus(OrganStatus.REJECTED);
        // 필요하면 별도의 사유 로그를 남기세요.
    }

    @Override
    public Optional<Organ> findByUserId(Long userId) {
        return organRepository.findByUserId(userId);
    }

    @Override
    public List<Organ> findPendings() {
        return organRepository.findAllByStatus(OrganStatus.PENDING);
    }
}
