package com.rewear.donation.repository;

import com.rewear.common.enums.DonationStatus;
import com.rewear.donation.entity.Donation;
import com.rewear.user.entity.User;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DonationRepository extends JpaRepository<Donation, Long> {
    @EntityGraph(attributePaths = {"donationItem", "organ"})
    List<Donation> findByDonor(User donor);
    
    @EntityGraph(attributePaths = {"donationItem", "organ", "donor"})
    List<Donation> findByStatus(DonationStatus status);
    
    @EntityGraph(attributePaths = {"donationItem", "organ", "donor"})
    @Query("SELECT d FROM Donation d")
    List<Donation> findAllWithDetails();
    
    List<Donation> findByOrganId(Long organId);
    List<Donation> findByOrganIdAndStatus(Long organId, DonationStatus status);
}