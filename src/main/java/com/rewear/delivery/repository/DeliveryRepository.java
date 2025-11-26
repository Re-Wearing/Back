package com.rewear.delivery.repository;

import com.rewear.common.enums.DeliveryStatus;
import com.rewear.delivery.entity.Delivery;
import com.rewear.donation.entity.Donation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DeliveryRepository extends JpaRepository<Delivery, Long> {
    Optional<Delivery> findByDonation(Donation donation);
    Optional<Delivery> findByTrackingNumber(String trackingNumber);
    List<Delivery> findByStatus(DeliveryStatus status);
}

