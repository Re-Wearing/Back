package com.rewear.delivery.service;

import com.rewear.common.enums.DeliveryStatus;
import com.rewear.delivery.DeliveryForm;
import com.rewear.delivery.entity.Delivery;
import com.rewear.delivery.repository.DeliveryRepository;
import com.rewear.donation.entity.Donation;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class DeliveryServiceImpl implements DeliveryService {

    private final DeliveryRepository deliveryRepository;

    @Override
    public Delivery createDelivery(Donation donation, DeliveryForm form) {
        // 이미 배송 정보가 있는지 확인
        Optional<Delivery> existingDelivery = deliveryRepository.findByDonation(donation);
        if (existingDelivery.isPresent()) {
            throw new IllegalStateException("이미 배송 정보가 등록되어 있습니다.");
        }

        Delivery delivery = Delivery.builder()
                .donation(donation)
                .trackingNumber(form.getTrackingNumber())
                .carrier(form.getCarrier())
                .senderName(form.getSenderName())
                .senderPhone(form.getSenderPhone())
                .senderAddress(form.getSenderAddress())
                .senderDetailAddress(form.getSenderDetailAddress())
                .senderPostalCode(form.getSenderPostalCode())
                .receiverName(form.getReceiverName())
                .receiverPhone(form.getReceiverPhone())
                .receiverAddress(form.getReceiverAddress())
                .receiverDetailAddress(form.getReceiverDetailAddress())
                .receiverPostalCode(form.getReceiverPostalCode())
                .status(DeliveryStatus.PENDING)
                .build();

        return deliveryRepository.save(delivery);
    }

    @Override
    public Delivery updateDelivery(Long deliveryId, DeliveryForm form) {
        Delivery delivery = deliveryRepository.findById(deliveryId)
                .orElseThrow(() -> new IllegalArgumentException("배송 정보를 찾을 수 없습니다."));

        delivery.setTrackingNumber(form.getTrackingNumber());
        delivery.setCarrier(form.getCarrier());
        delivery.setSenderName(form.getSenderName());
        delivery.setSenderPhone(form.getSenderPhone());
        delivery.setSenderAddress(form.getSenderAddress());
        delivery.setSenderDetailAddress(form.getSenderDetailAddress());
        delivery.setSenderPostalCode(form.getSenderPostalCode());
        delivery.setReceiverName(form.getReceiverName());
        delivery.setReceiverPhone(form.getReceiverPhone());
        delivery.setReceiverAddress(form.getReceiverAddress());
        delivery.setReceiverDetailAddress(form.getReceiverDetailAddress());
        delivery.setReceiverPostalCode(form.getReceiverPostalCode());

        return deliveryRepository.save(delivery);
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<Delivery> getDeliveryByDonation(Donation donation) {
        return deliveryRepository.findByDonation(donation);
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<Delivery> getDeliveryById(Long deliveryId) {
        return deliveryRepository.findByIdWithDetails(deliveryId);
    }

    @Override
    public Delivery updateDeliveryStatus(Long deliveryId, DeliveryStatus status) {
        Delivery delivery = deliveryRepository.findById(deliveryId)
                .orElseThrow(() -> new IllegalArgumentException("배송 정보를 찾을 수 없습니다."));

        delivery.setStatus(status);

        // 상태에 따라 날짜 업데이트
        if (status == DeliveryStatus.IN_TRANSIT && delivery.getShippedAt() == null) {
            delivery.setShippedAt(LocalDateTime.now());
        } else if (status == DeliveryStatus.DELIVERED && delivery.getDeliveredAt() == null) {
            delivery.setDeliveredAt(LocalDateTime.now());
        }

        return deliveryRepository.save(delivery);
    }

    @Override
    @Transactional(readOnly = true)
    public List<Delivery> getAllDeliveries() {
        return deliveryRepository.findAll();
    }

    @Override
    @Transactional(readOnly = true)
    public List<Delivery> getDeliveriesByStatus(DeliveryStatus status) {
        return deliveryRepository.findByStatus(status);
    }
}

