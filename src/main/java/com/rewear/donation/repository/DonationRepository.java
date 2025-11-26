package com.rewear.donation.repository;

import com.rewear.common.enums.DonationStatus;
import com.rewear.donation.entity.Donation;
import com.rewear.user.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DonationRepository extends JpaRepository<Donation, Long> {
    List<Donation> findByDonor(User donor);
    List<Donation> findByOrganId(Long organId);
    List<Donation> findByStatus(DonationStatus status);
    List<Donation> findByOrganIdAndStatus(Long organId, DonationStatus status);
}