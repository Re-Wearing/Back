package com.rewear.organ.controller;

import com.rewear.common.enums.DonationMethod;
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
        
        // REQUESTED 이상 상태인 기부 목록 조회 (PENDING 제외, SHIPPED, COMPLETED 제외)
        // 관리자 승인 완료된 기부만 기관에게 표시
        List<Donation> allDonations = donationService.getAllDonations();
        List<Donation> donations = allDonations.stream()
                .filter(d -> d.getStatus() == DonationStatus.REQUESTED || d.getStatus() == DonationStatus.MATCHED)
                .filter(d -> {
                    // 간접 매칭이고 REQUESTED 상태이며 해당 기관에 할당된 경우는 매칭된 기부에 표시 (승인/거부 가능)
                    if (d.getDonationMethod() == DonationMethod.INDIRECT_MATCH
                            && d.getStatus() == DonationStatus.REQUESTED
                            && d.getOrgan() != null && d.getOrgan().getId().equals(organ.getId())) {
                        return true; // 매칭된 기부에 표시
                    }
                    // 이미 같은 기관이 선택한 경우는 제외 (단, MATCHED 상태일 때만 제외)
                    if (d.getOrgan() != null && d.getOrgan().getId().equals(organ.getId())
                            && d.getStatus() == DonationStatus.MATCHED) {
                        return false;
                    }
                    // 직접 매칭이고 REQUESTED 상태인 경우는 표시
                    if (d.getDonationMethod() == DonationMethod.DIRECT_MATCH
                            && d.getStatus() == DonationStatus.REQUESTED) {
                        return true;
                    }
                    // 직접 매칭이고 MATCHED 상태인 경우는 표시
                    if (d.getDonationMethod() == DonationMethod.DIRECT_MATCH
                            && d.getStatus() == DonationStatus.MATCHED) {
                        return true;
                    }
                    return false;
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
        
        // SHIPPED 상태면 목록으로 리다이렉트
        if (donation.getStatus() == DonationStatus.SHIPPED) {
            return "redirect:/organ/donations";
        }
        
        // COMPLETED 상태인 경우 해당 기관에 할당된 기부인지 확인
        if (donation.getStatus() == DonationStatus.COMPLETED) {
            if (donation.getOrgan() == null || !donation.getOrgan().getId().equals(organ.getId())) {
                return "redirect:/organ/matched";
            }
            // COMPLETED 상태이고 해당 기관에 할당된 경우 히스토리 정보 표시
            model.addAttribute("donation", donation);
            model.addAttribute("isHistory", true);
            return "organ/donation-detail";
        }
        
        // 이미 같은 기관이 선택한 경우 체크
        boolean alreadyMatched = donation.getOrgan() != null && donation.getOrgan().getId().equals(organ.getId());
        
        model.addAttribute("donation", donation);
        model.addAttribute("alreadyMatched", alreadyMatched);
        model.addAttribute("isHistory", false);
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

    // 간접 매칭 기부 최종 승인
    @PostMapping("/donations/{donationId}/approve")
    public String approveDonation(
            @PathVariable Long donationId,
            @AuthenticationPrincipal CustomUserDetails principal,
            RedirectAttributes redirectAttributes) {
        
        User user = userService.findByUsername(principal.getUsername())
                .orElseThrow(() -> new IllegalStateException("사용자를 찾을 수 없습니다."));

        Optional<Organ> organOpt = organService.findByUserId(user.getId());
        if (organOpt.isEmpty()) {
            redirectAttributes.addFlashAttribute("error", "기관 정보를 찾을 수 없습니다.");
            return "redirect:/organ/matched";
        }

        Organ organ = organOpt.get();

        try {
            donationService.organApproveDonation(donationId, organ);
            redirectAttributes.addFlashAttribute("success", "기부를 최종 승인하여 완료되었습니다.");
        } catch (IllegalStateException | IllegalArgumentException e) {
            redirectAttributes.addFlashAttribute("error", e.getMessage());
        }

        return "redirect:/organ/donations";
    }

    // 간접 매칭 기부 거부
    @PostMapping("/donations/{donationId}/reject")
    public String rejectDonation(
            @PathVariable Long donationId,
            @AuthenticationPrincipal CustomUserDetails principal,
            RedirectAttributes redirectAttributes) {
        
        User user = userService.findByUsername(principal.getUsername())
                .orElseThrow(() -> new IllegalStateException("사용자를 찾을 수 없습니다."));

        Optional<Organ> organOpt = organService.findByUserId(user.getId());
        if (organOpt.isEmpty()) {
            redirectAttributes.addFlashAttribute("error", "기관 정보를 찾을 수 없습니다.");
            return "redirect:/organ/matched";
        }

        Organ organ = organOpt.get();

        try {
            donationService.organRejectDonation(donationId, organ);
            redirectAttributes.addFlashAttribute("success", "기부를 거부했습니다.");
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
        
        // 받은 기부는 COMPLETED 상태만 표시 (히스토리)
        List<Donation> allDonations = donationService.getAllDonations();
        List<Donation> matchedDonations = allDonations.stream()
                .filter(d -> d.getOrgan() != null && d.getOrgan().getId().equals(organ.getId()))
                .filter(d -> d.getStatus() == DonationStatus.COMPLETED)
                .toList();
        
        model.addAttribute("donations", matchedDonations);
        return "organ/matched";
    }
}

