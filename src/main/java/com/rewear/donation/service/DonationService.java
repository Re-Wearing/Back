package com.rewear.donation.service;

import com.rewear.common.enums.DonationStatus;
import com.rewear.donation.DonationForm;
import com.rewear.donation.entity.Donation;
import com.rewear.organ.entity.Organ;
import com.rewear.user.entity.User;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

public interface DonationService {
    Donation createDonation(User donor, DonationForm form, MultipartFile image);
    List<Donation> getDonationsByUser(User user);
    List<Donation> getAllDonations();
    List<Donation> getDonationsByStatus(DonationStatus status);
    Donation matchDonation(Long donationId, Organ organ);
    List<Donation> getMatchedDonationsByOrgan(Organ organ);
    Donation getDonationById(Long donationId);
}