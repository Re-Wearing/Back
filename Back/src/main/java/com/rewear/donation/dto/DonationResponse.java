package com.rewear.donation.dto;

import com.rewear.common.enums.DeliveryMethod;
import com.rewear.common.enums.DonationStatus;
import com.rewear.common.enums.MatchType;
import com.rewear.donation.entity.Donation;
import lombok.Builder;

import java.time.LocalDateTime;

@Builder
public record DonationResponse(
        Long id,
        DonationStatus status,
        MatchType matchType,
        DeliveryMethod deliveryMethod,
        Boolean isAnonymous,
        String imageUrl,
        String organName,
        LocalDateTime createdAt
) {
    public static DonationResponse from(Donation donation) {
        return DonationResponse.builder()
                .id(donation.getId())
                .status(donation.getStatus())
                .matchType(donation.getMatchType())
                .deliveryMethod(donation.getDeliveryMethod())
                .isAnonymous(donation.getIsAnonymous())
                .imageUrl(donation.getDonationItem() != null ? donation.getDonationItem().getImageUrl() : null)
                .organName(donation.getOrgan() != null ? donation.getOrgan().getOrgName() : null)
                .createdAt(donation.getCreatedAt())
                .build();
    }
}

