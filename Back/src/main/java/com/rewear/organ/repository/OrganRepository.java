package com.rewear.organ.repository;

import com.rewear.common.enums.OrganStatus;
import com.rewear.organ.entity.Organ;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface OrganRepository extends JpaRepository<Organ, Long> {

    Optional<Organ> findByUserId(Long userId);

    boolean existsByBusinessNo(String businessNo);

    List<Organ> findAllByStatus(OrganStatus status);

    List<Organ> findAllByStatusOrderByIdDesc(OrganStatus status);

    List<Organ> findByStatusOrderByCreatedAtDesc(OrganStatus status);
    
    // User 정보를 함께 로드하기 위한 쿼리
    @Query("SELECT o FROM Organ o JOIN FETCH o.user WHERE o.status = :status ORDER BY o.id DESC")
    List<Organ> findAllByStatusOrderByIdDescWithUser(@Param("status") OrganStatus status);
}

