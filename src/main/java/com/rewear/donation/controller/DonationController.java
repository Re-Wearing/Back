package com.rewear.donation.controller;

import com.rewear.donation.DonationForm;
import com.rewear.donation.entity.Donation;
import com.rewear.donation.service.DonationService;
import com.rewear.organ.entity.Organ;
import com.rewear.organ.repository.OrganRepository;
import com.rewear.user.details.CustomUserDetails;
import com.rewear.user.entity.User;
import com.rewear.user.service.UserServiceImpl;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.validation.BindingResult;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

import java.util.List;
import java.util.stream.Collectors;

@Controller
@RequestMapping("/donations")
@RequiredArgsConstructor
public class DonationController {

    private final DonationService donationService;
    private final OrganRepository organRepository;
    private final UserServiceImpl userService;

    @GetMapping("/apply")
    @PreAuthorize("hasRole('USER')")
    public String donationForm(@ModelAttribute("form") DonationForm form, Model model) {
        List<Organ> approvedOrgans = organRepository.findAll().stream()
                .filter(org -> org.getStatus().name().equals("APPROVED"))
                .collect(Collectors.toList());
        model.addAttribute("organs", approvedOrgans);
        return "donation/apply";
    }

    @PostMapping("/apply")
    @PreAuthorize("hasRole('USER')")
    public String submitDonation(
            @AuthenticationPrincipal CustomUserDetails principal,
            @Valid @ModelAttribute("form") DonationForm form,
            BindingResult bindingResult,
            Model model,
            RedirectAttributes redirectAttributes) {

        if (bindingResult.hasErrors()) {
            List<Organ> approvedOrgans = organRepository.findAll().stream()
                    .filter(org -> org.getStatus().name().equals("APPROVED"))
                    .collect(Collectors.toList());
            model.addAttribute("organs", approvedOrgans);
            return "donation/apply";
        }

        User donor = userService.findByUsername(principal.getUsername())
                .orElseThrow(() -> new IllegalStateException("사용자를 찾을 수 없습니다."));

        donationService.createDonation(donor, form, form.getImage());

        redirectAttributes.addFlashAttribute("success", "기부 신청이 완료되었습니다.");
        return "redirect:/donations";
    }

    @GetMapping
    @PreAuthorize("hasRole('USER')")
    public String myDonations(@AuthenticationPrincipal CustomUserDetails principal, Model model) {
        User user = userService.findByUsername(principal.getUsername())
                .orElseThrow(() -> new IllegalStateException("사용자를 찾을 수 없습니다."));
        List<Donation> donations = donationService.getDonationsByUser(user);
        model.addAttribute("donations", donations);
        return "donation/list";
    }
}