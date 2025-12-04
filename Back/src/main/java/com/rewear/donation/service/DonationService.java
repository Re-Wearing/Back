package com.rewear.donation.service;

import com.rewear.common.enums.DonationStatus;
import com.rewear.donation.DonationForm;
import com.rewear.donation.DonationItemForm;
import com.rewear.donation.entity.Donation;
import com.rewear.organ.entity.Organ;
import com.rewear.user.entity.User;

import java.util.List;

public interface DonationService {
    Donation createDonation(User donor, DonationForm form, DonationItemForm itemForm, Organ organ);
    List<Donation> getDonationsByUser(User user);
    List<Donation> getAllDonations();
    List<Donation> getDonationsByStatus(DonationStatus status);
    Donation matchDonation(Long donationId, Organ organ);
    Donation assignDonationToOrgan(Long donationId, Organ organ);
    List<Donation> getMatchedDonationsByOrgan(Organ organ);
    Donation getDonationById(Long donationId);
    Donation approveDonation(Long donationId);
    Donation rejectDonation(Long donationId, String reason);
    Donation cancelDonation(Long donationId, String reason);
    Donation organApproveDonation(Long donationId, Organ organ);
    Donation organRejectDonation(Long donationId, Organ organ);
}