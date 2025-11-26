package com.rewear.delivery.service;

import com.rewear.common.enums.DeliveryStatus;
import com.rewear.delivery.DeliveryForm;
import com.rewear.delivery.entity.Delivery;
import com.rewear.donation.entity.Donation;

import java.util.List;
import java.util.Optional;

public interface DeliveryService {
    Delivery createDelivery(Donation donation, DeliveryForm form);
    Delivery updateDelivery(Long deliveryId, DeliveryForm form);
    Optional<Delivery> getDeliveryByDonation(Donation donation);
    Optional<Delivery> getDeliveryById(Long deliveryId);
    Delivery updateDeliveryStatus(Long deliveryId, DeliveryStatus status);
    List<Delivery> getAllDeliveries();
    List<Delivery> getDeliveriesByStatus(DeliveryStatus status);
}

