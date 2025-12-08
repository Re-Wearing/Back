package com.rewear.donation.repository;

import com.rewear.common.enums.DonationStatus;
import com.rewear.donation.entity.Donation;
import com.rewear.user.entity.User;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DonationRepository extends JpaRepository<Donation, Long> {
    @Query("SELECT DISTINCT d FROM Donation d " +
           "LEFT JOIN FETCH d.donationItem " +
           "LEFT JOIN FETCH d.organ " +
           "LEFT JOIN FETCH d.donor " +
           "WHERE d.donor = :donor")
    List<Donation> findByDonor(@Param("donor") User donor);
    
    @EntityGraph(attributePaths = {"donationItem", "organ", "donor"})
    List<Donation> findByStatus(DonationStatus status);
    
    @Query("SELECT d FROM Donation d " +
           "LEFT JOIN FETCH d.donationItem " +
           "LEFT JOIN FETCH d.organ " +
           "LEFT JOIN FETCH d.donor " +
           "LEFT JOIN FETCH d.delivery")
    List<Donation> findAllWithDetails();
    
    @Query("SELECT d FROM Donation d " +
           "LEFT JOIN FETCH d.donationItem " +
           "LEFT JOIN FETCH d.organ " +
           "LEFT JOIN FETCH d.donor " +
           "LEFT JOIN FETCH d.delivery " +
           "WHERE d.id = :id")
    java.util.Optional<Donation> findByIdWithDetails(@Param("id") Long id);
    
    List<Donation> findByOrganId(Long organId);
    List<Donation> findByOrganIdAndStatus(Long organId, DonationStatus status);
}