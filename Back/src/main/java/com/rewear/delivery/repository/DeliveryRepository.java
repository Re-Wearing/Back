package com.rewear.delivery.repository;

import com.rewear.common.enums.DeliveryStatus;
import com.rewear.delivery.entity.Delivery;
import com.rewear.donation.entity.Donation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DeliveryRepository extends JpaRepository<Delivery, Long> {
    Optional<Delivery> findByDonation(Donation donation);
    Optional<Delivery> findByTrackingNumber(String trackingNumber);
    List<Delivery> findByStatus(DeliveryStatus status);
    
    @Query("SELECT d FROM Delivery d " +
           "LEFT JOIN FETCH d.donation don " +
           "LEFT JOIN FETCH don.donationItem " +
           "LEFT JOIN FETCH don.organ " +
           "LEFT JOIN FETCH don.donor " +
           "WHERE d.id = :id")
    Optional<Delivery> findByIdWithDetails(@Param("id") Long id);
}

