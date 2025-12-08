package com.rewear.delivery.controller;

import com.rewear.common.enums.DeliveryStatus;
import com.rewear.delivery.entity.Delivery;
import com.rewear.delivery.service.DeliveryService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/deliveries")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminDeliveryApiController {

    private final DeliveryService deliveryService;

    /**
     * 배송 목록 조회 API
     */
    @GetMapping
    public ResponseEntity<Map<String, Object>> getAllDeliveries() {
        List<Delivery> deliveries = deliveryService.getAllDeliveries();
        
        List<Map<String, Object>> deliveryList = deliveries.stream()
                .map(this::convertToDeliveryDto)
                .collect(java.util.stream.Collectors.toList());
        
        Map<String, Object> response = new HashMap<>();
        response.put("deliveries", deliveryList);
        
        return ResponseEntity.ok(response);
    }

    /**
     * 배송 상세 조회 API
     */
    @GetMapping("/{deliveryId}")
    public ResponseEntity<Map<String, Object>> getDelivery(@PathVariable Long deliveryId) {
        Delivery delivery = deliveryService.getDeliveryById(deliveryId)
                .orElseThrow(() -> new IllegalArgumentException("배송 정보를 찾을 수 없습니다."));
        
        Map<String, Object> response = new HashMap<>();
        response.put("delivery", convertToDeliveryDto(delivery));
        
        return ResponseEntity.ok(response);
    }

    /**
     * 배송 상태 업데이트 API
     */
    @PutMapping("/{deliveryId}")
    public ResponseEntity<Map<String, Object>> updateDeliveryStatus(
            @PathVariable Long deliveryId,
            @RequestBody Map<String, String> request) {
        
        String statusStr = request.get("status");
        if (statusStr == null || statusStr.isEmpty()) {
            Map<String, Object> error = new HashMap<>();
            error.put("error", "배송 상태를 입력해주세요.");
            return ResponseEntity.badRequest().body(error);
        }

        try {
            DeliveryStatus status = DeliveryStatus.valueOf(statusStr.toUpperCase());
            
            Delivery updatedDelivery = deliveryService.updateDeliveryStatus(deliveryId, status);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "배송 상태가 업데이트되었습니다.");
            response.put("delivery", convertToDeliveryDto(updatedDelivery));
            
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            Map<String, Object> error = new HashMap<>();
            error.put("error", "유효하지 않은 배송 상태입니다: " + statusStr);
            return ResponseEntity.badRequest().body(error);
        } catch (Exception e) {
            Map<String, Object> error = new HashMap<>();
            error.put("error", "배송 상태 업데이트에 실패했습니다: " + e.getMessage());
            return ResponseEntity.status(500).body(error);
        }
    }

    /**
     * Delivery 엔티티를 프론트엔드에서 사용할 수 있는 형태로 변환
     */
    private Map<String, Object> convertToDeliveryDto(Delivery delivery) {
        Map<String, Object> dto = new HashMap<>();
        dto.put("id", delivery.getId());
        dto.put("trackingNumber", delivery.getTrackingNumber());
        dto.put("carrier", delivery.getCarrier());
        dto.put("senderName", delivery.getSenderName());
        dto.put("senderPhone", delivery.getSenderPhone());
        dto.put("senderAddress", delivery.getSenderAddress());
        dto.put("senderDetailAddress", delivery.getSenderDetailAddress());
        dto.put("senderPostalCode", delivery.getSenderPostalCode());
        dto.put("receiverName", delivery.getReceiverName());
        dto.put("receiverPhone", delivery.getReceiverPhone());
        dto.put("receiverAddress", delivery.getReceiverAddress());
        dto.put("receiverDetailAddress", delivery.getReceiverDetailAddress());
        dto.put("receiverPostalCode", delivery.getReceiverPostalCode());
        dto.put("status", delivery.getStatus() != null ? delivery.getStatus().name() : "PENDING");
        dto.put("shippedAt", delivery.getShippedAt() != null ? delivery.getShippedAt().toString() : null);
        dto.put("deliveredAt", delivery.getDeliveredAt() != null ? delivery.getDeliveredAt().toString() : null);
        dto.put("createdAt", delivery.getCreatedAt() != null ? delivery.getCreatedAt().toString() : null);
        dto.put("updatedAt", delivery.getUpdatedAt() != null ? delivery.getUpdatedAt().toString() : null);
        return dto;
    }
}

