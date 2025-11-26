package com.rewear.organ.controller;

import com.rewear.common.enums.DonationStatus;
import com.rewear.donation.entity.Donation;
import com.rewear.donation.service.DonationService;
import com.rewear.organ.entity.Organ;
import com.rewear.organ.service.OrganService;
import com.rewear.user.details.CustomUserDetails;
import com.rewear.user.entity.User;
import com.rewear.user.service.UserServiceImpl;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

import java.util.List;
import java.util.Optional;

@Controller
@RequestMapping("/organ")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ORGAN')")
public class OrganController {

    private final DonationService donationService;
    private final OrganService organService;
    private final UserServiceImpl userService;

    @GetMapping("/donations")
    public String availableDonations(
            @AuthenticationPrincipal CustomUserDetails principal,
            Model model) {
        
        User user = userService.findByUsername(principal.getUsername())
                .orElseThrow(() -> new IllegalStateException("사용자를 찾을 수 없습니다."));

        Optional<Organ> organOpt = organService.findByUserId(user.getId());
        if (organOpt.isEmpty()) {
            model.addAttribute("error", "기관 정보를 찾을 수 없습니다.");
            return "organ/donations";
        }

        Organ organ = organOpt.get();
        
        // REQUESTED 또는 MATCHED 상태인 기부 목록 조회 (SHIPPED, COMPLETED 제외)
        List<Donation> allDonations = donationService.getAllDonations();
        List<Donation> donations = allDonations.stream()
                .filter(d -> d.getStatus() == DonationStatus.REQUESTED || d.getStatus() == DonationStatus.MATCHED)
                .filter(d -> {
                    // 이미 같은 기관이 선택한 경우는 제외
                    if (d.getOrgan() != null && d.getOrgan().getId().equals(organ.getId())) {
                        return false;
                    }
                    return true;
                })
                .toList();
        
        model.addAttribute("donations", donations);
        return "organ/donations";
    }

    @GetMapping("/donations/{donationId}")
    public String donationDetail(
            @PathVariable Long donationId,
            @AuthenticationPrincipal CustomUserDetails principal,
            Model model) {
        
        User user = userService.findByUsername(principal.getUsername())
                .orElseThrow(() -> new IllegalStateException("사용자를 찾을 수 없습니다."));

        Optional<Organ> organOpt = organService.findByUserId(user.getId());
        if (organOpt.isEmpty()) {
            return "redirect:/organ/donations";
        }

        Organ organ = organOpt.get();
        Donation donation = donationService.getDonationById(donationId);
        
        // SHIPPED, COMPLETED 상태면 목록으로 리다이렉트
        if (donation.getStatus() == DonationStatus.SHIPPED || donation.getStatus() == DonationStatus.COMPLETED) {
            return "redirect:/organ/donations";
        }
        
        // 이미 같은 기관이 선택한 경우 체크
        boolean alreadyMatched = donation.getOrgan() != null && donation.getOrgan().getId().equals(organ.getId());
        
        model.addAttribute("donation", donation);
        model.addAttribute("alreadyMatched", alreadyMatched);
        return "organ/donation-detail";
    }

    @PostMapping("/donations/{donationId}/match")
    public String matchDonation(
            @PathVariable Long donationId,
            @AuthenticationPrincipal CustomUserDetails principal,
            RedirectAttributes redirectAttributes) {
        
        User user = userService.findByUsername(principal.getUsername())
                .orElseThrow(() -> new IllegalStateException("사용자를 찾을 수 없습니다."));

        Optional<Organ> organOpt = organService.findByUserId(user.getId());
        if (organOpt.isEmpty()) {
            redirectAttributes.addFlashAttribute("error", "기관 정보를 찾을 수 없습니다.");
            return "redirect:/organ/donations";
        }

        Organ organ = organOpt.get();

        try {
            donationService.matchDonation(donationId, organ);
            redirectAttributes.addFlashAttribute("success", "기부를 성공적으로 매칭했습니다.");
        } catch (IllegalStateException | IllegalArgumentException e) {
            redirectAttributes.addFlashAttribute("error", e.getMessage());
        }

        return "redirect:/organ/donations";
    }

    @GetMapping("/matched")
    public String matchedDonations(
            @AuthenticationPrincipal CustomUserDetails principal,
            Model model) {
        
        User user = userService.findByUsername(principal.getUsername())
                .orElseThrow(() -> new IllegalStateException("사용자를 찾을 수 없습니다."));

        Optional<Organ> organOpt = organService.findByUserId(user.getId());
        if (organOpt.isEmpty()) {
            model.addAttribute("error", "기관 정보를 찾을 수 없습니다.");
            return "organ/matched";
        }

        Organ organ = organOpt.get();
        List<Donation> matchedDonations = donationService.getMatchedDonationsByOrgan(organ);
        
        model.addAttribute("donations", matchedDonations);
        return "organ/matched";
    }
}

