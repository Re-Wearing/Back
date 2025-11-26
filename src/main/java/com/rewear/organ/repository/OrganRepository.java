package com.rewear.organ.repository;

import com.rewear.common.enums.OrganStatus;
import com.rewear.organ.entity.Organ;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface OrganRepository extends JpaRepository<Organ, Long> {

    Optional<Organ> findByUserId(Long userId);

    boolean existsByBusinessNo(String businessNo);

    List<Organ> findAllByStatus(OrganStatus status);

    List<Organ> findAllByStatusOrderByIdDesc(OrganStatus status);

    List<Organ> findByStatusOrderByCreatedAtDesc(OrganStatus status);
}

