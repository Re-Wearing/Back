package com.rewear.delivery.controller;

import com.rewear.delivery.entity.Delivery;
import com.rewear.delivery.service.DeliveryService;
import com.rewear.donation.entity.Donation;
import com.rewear.donation.repository.DonationRepository;
import com.rewear.user.details.CustomUserDetails;
import com.rewear.user.entity.User;
import com.rewear.user.service.UserServiceImpl;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;

import java.util.List;
import java.util.Optional;

@Controller
@RequestMapping("/deliveries")
@RequiredArgsConstructor
public class DeliveryController {

    private final DeliveryService deliveryService;
    private final DonationRepository donationRepository;
    private final UserServiceImpl userService;

    // User는 배송 정보 조회만 가능
    @GetMapping("/{deliveryId}")
    @PreAuthorize("hasRole('USER')")
    public String deliveryDetail(
            @PathVariable("deliveryId") Long deliveryId,
            @AuthenticationPrincipal CustomUserDetails principal,
            Model model) {

        User user = userService.findByUsername(principal.getUsername())
                .orElseThrow(() -> new IllegalStateException("사용자를 찾을 수 없습니다."));

        Delivery delivery = deliveryService.getDeliveryById(deliveryId)
                .orElseThrow(() -> new IllegalArgumentException("배송 정보를 찾을 수 없습니다."));

        // 본인의 기부인지 확인
        if (!delivery.getDonation().getDonor().getId().equals(user.getId())) {
            throw new IllegalStateException("권한이 없습니다.");
        }

        model.addAttribute("delivery", delivery);
        model.addAttribute("readOnly", true); // 읽기 전용 모드
        return "delivery/detail";
    }

    @GetMapping("/list")
    @PreAuthorize("hasRole('USER')")
    public String deliveryList(
            @AuthenticationPrincipal CustomUserDetails principal,
            Model model) {

        User user = userService.findByUsername(principal.getUsername())
                .orElseThrow(() -> new IllegalStateException("사용자를 찾을 수 없습니다."));

        // 사용자의 기부 목록 가져오기
        List<Donation> donations = donationRepository.findByDonor(user);
        
        // 각 기부에 대한 배송 정보 가져오기
        List<Delivery> deliveries = donations.stream()
                .map(donation -> deliveryService.getDeliveryByDonation(donation))
                .filter(Optional::isPresent)
                .map(Optional::get)
                .toList();

        model.addAttribute("deliveries", deliveries);
        return "delivery/list";
    }

}

