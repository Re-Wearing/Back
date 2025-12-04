package com.rewear.donation.controller;

import com.rewear.common.enums.MatchType;
import com.rewear.delivery.service.DeliveryService;
import com.rewear.donation.DonationForm;
import com.rewear.donation.DonationItemForm;
import com.rewear.donation.entity.Donation;
import com.rewear.donation.service.DonationService;
import com.rewear.organ.entity.Organ;
import com.rewear.organ.repository.OrganRepository;
import com.rewear.user.details.CustomUserDetails;
import com.rewear.user.entity.User;
import com.rewear.user.service.UserServiceImpl;
import jakarta.servlet.http.HttpSession;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.validation.BindingResult;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Controller
@RequestMapping("/donations")
@RequiredArgsConstructor
public class DonationController {

    private final DonationService donationService;
    private final OrganRepository organRepository;
    private final UserServiceImpl userService;
    private final DeliveryService deliveryService;

    @Value("${app.upload.dir:uploads}")
    private String uploadDir;

    // 1단계: 물품 정보 입력
    @GetMapping("/apply/item")
    @PreAuthorize("hasRole('USER')")
    public String donationItemForm(@ModelAttribute("itemForm") DonationItemForm itemForm) {
        return "donation/apply-item";
    }

    @PostMapping("/apply/item")
    @PreAuthorize("hasRole('USER')")
    public String submitDonationItem(
            @Valid @ModelAttribute("itemForm") DonationItemForm itemForm,
            BindingResult bindingResult,
            HttpSession session,
            RedirectAttributes redirectAttributes) {

        if (bindingResult.hasErrors()) {
            return "donation/apply-item";
        }

        // 여러 이미지가 있는 경우 즉시 저장 (MultipartFile은 세션에 저장할 수 없음)
        List<String> savedImageUrls = new java.util.ArrayList<>();
        
        // 여러 이미지 처리 (우선)
        if (itemForm.getImages() != null && !itemForm.getImages().isEmpty()) {
            for (MultipartFile image : itemForm.getImages()) {
                if (image != null && !image.isEmpty()) {
                    try {
                        String imageUrl = saveImage(image);
                        savedImageUrls.add(imageUrl);
                        log.info("기부 신청 1단계 - 이미지 저장 완료: {}", imageUrl);
                    } catch (IOException e) {
                        log.error("이미지 저장 실패", e);
                        bindingResult.rejectValue("images", "error.image", "이미지 저장에 실패했습니다.");
                        return "donation/apply-item";
                    }
                }
            }
        }
        // 단일 이미지 처리 (하위 호환성)
        else if (itemForm.getImage() != null && !itemForm.getImage().isEmpty()) {
            try {
                String imageUrl = saveImage(itemForm.getImage());
                savedImageUrls.add(imageUrl);
                itemForm.setImageUrl(imageUrl);
                // MultipartFile은 세션에 저장할 수 없으므로 null로 설정
                itemForm.setImage(null);
                log.info("기부 신청 1단계 - 이미지 저장 완료: {}", imageUrl);
            } catch (IOException e) {
                log.error("이미지 저장 실패", e);
                bindingResult.rejectValue("image", "error.image", "이미지 저장에 실패했습니다.");
                return "donation/apply-item";
            }
        }
        
        // 저장된 이미지 URL을 Form에 설정
        if (!savedImageUrls.isEmpty()) {
            itemForm.setImageUrls(savedImageUrls);
            // 첫 번째 이미지를 imageUrl에도 설정 (하위 호환성)
            if (itemForm.getImageUrl() == null) {
                itemForm.setImageUrl(savedImageUrls.get(0));
            }
            // MultipartFile은 세션에 저장할 수 없으므로 null로 설정
            itemForm.setImages(null);
            itemForm.setImage(null);
        } else {
            log.info("기부 신청 1단계 - 이미지가 없거나 비어있음");
        }

        // 세션에 물품 정보 저장
        log.info("기부 신청 1단계 - 세션에 저장할 이미지 URL: {}", itemForm.getImageUrl());
        session.setAttribute("donationItemForm", itemForm);

        return "redirect:/donations/apply/method";
    }

    // 2단계: 기부 방법 선택
    @GetMapping("/apply/method")
    @PreAuthorize("hasRole('USER')")
    public String donationMethodForm(
            @ModelAttribute("form") DonationForm form,
            HttpSession session,
            Model model) {

        // 세션에서 물품 정보 확인
        DonationItemForm itemForm = (DonationItemForm) session.getAttribute("donationItemForm");
        if (itemForm == null) {
            return "redirect:/donations/apply/item";
        }

        List<Organ> approvedOrgans = organRepository.findAll().stream()
                .filter(org -> org.getStatus().name().equals("APPROVED"))
                .collect(Collectors.toList());
        model.addAttribute("organs", approvedOrgans);
        model.addAttribute("itemForm", itemForm); // 미리보기용

        return "donation/apply-method";
    }

    @PostMapping("/apply/method")
    @PreAuthorize("hasRole('USER')")
    public String submitDonation(
            @AuthenticationPrincipal CustomUserDetails principal,
            @Valid @ModelAttribute("form") DonationForm form,
            BindingResult bindingResult,
            HttpSession session,
            Model model,
            RedirectAttributes redirectAttributes) {

        // 세션에서 물품 정보 가져오기
        DonationItemForm itemForm = (DonationItemForm) session.getAttribute("donationItemForm");
        if (itemForm == null) {
            redirectAttributes.addFlashAttribute("error", "물품 정보가 없습니다. 다시 입력해주세요.");
            return "redirect:/donations/apply/item";
        }
        
        // 디버깅: 세션에서 가져온 이미지 URL 확인
        log.info("기부 신청 2단계 - 세션에서 가져온 이미지 URL: {}", itemForm.getImageUrl());

        // 직접 매칭인 경우 기관 선택 필수 검증
        if (form.getMatchType() == MatchType.DIRECT && form.getOrganId() == null) {
            bindingResult.rejectValue("organId", "required", "직접 매칭 시 희망 기관을 선택해주세요.");
        }

        if (bindingResult.hasErrors()) {
            List<Organ> approvedOrgans = organRepository.findAll().stream()
                    .filter(org -> org.getStatus().name().equals("APPROVED"))
                    .collect(Collectors.toList());
            model.addAttribute("organs", approvedOrgans);
            model.addAttribute("itemForm", itemForm);
            return "donation/apply-method";
        }

        User donor = userService.findByUsername(principal.getUsername())
                .orElseThrow(() -> new IllegalStateException("사용자를 찾을 수 없습니다."));

        // 직접 매칭인 경우 기관 조회, 간접 매칭은 null
        Organ organ = null;
        if (form.getMatchType() == MatchType.DIRECT && form.getOrganId() != null) {
            organ = organRepository.findById(form.getOrganId())
                    .orElseThrow(() -> new IllegalStateException("선택한 기관을 찾을 수 없습니다."));
        }

        donationService.createDonation(donor, form, itemForm, organ);

        // 세션에서 물품 정보 제거
        session.removeAttribute("donationItemForm");

        redirectAttributes.addFlashAttribute("success", "기부 신청이 완료되었습니다.");
        return "redirect:/donations";
    }

    @GetMapping
    @PreAuthorize("hasRole('USER')")
    public String myDonations(@AuthenticationPrincipal CustomUserDetails principal, Model model) {
        User user = userService.findByUsername(principal.getUsername())
                .orElseThrow(() -> new IllegalStateException("사용자를 찾을 수 없습니다."));
        List<Donation> donations = donationService.getDonationsByUser(user);
        
        // 각 기부에 대한 배송 정보 로드
        donations.forEach(donation -> {
            deliveryService.getDeliveryByDonation(donation).ifPresent(delivery -> {
                donation.setDelivery(delivery);
            });
        });
        
        model.addAttribute("donations", donations);
        return "donation/list";
    }

    private String saveImage(MultipartFile image) throws IOException {
        Path uploadPath = Paths.get(uploadDir);
        if (!Files.exists(uploadPath)) {
            Files.createDirectories(uploadPath);
        }

        String originalFilename = image.getOriginalFilename();
        String extension = originalFilename != null && originalFilename.contains(".")
                ? originalFilename.substring(originalFilename.lastIndexOf("."))
                : "";
        String filename = UUID.randomUUID().toString() + extension;
        Path filePath = uploadPath.resolve(filename);

        Files.copy(image.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);
        return filename;
    }
}