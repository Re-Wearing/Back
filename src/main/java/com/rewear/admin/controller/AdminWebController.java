package com.rewear.admin.controller;

import com.rewear.admin.service.AdminServiceImpl;
import com.rewear.common.enums.DeliveryStatus;
import com.rewear.common.enums.DonationMethod;
import com.rewear.common.enums.DonationStatus;
import com.rewear.common.enums.OrganStatus;
import com.rewear.delivery.DeliveryForm;
import com.rewear.delivery.entity.Delivery;
import com.rewear.delivery.service.DeliveryService;
import com.rewear.donation.entity.Donation;
import com.rewear.donation.repository.DonationRepository;
import com.rewear.donation.service.DonationService;
import com.rewear.faq.FAQForm;
import com.rewear.faq.entity.FAQ;
import com.rewear.faq.service.FAQServiceImpl;
import com.rewear.organ.entity.Organ;
import com.rewear.organ.service.OrganService;
import com.rewear.user.entity.User;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.validation.BindingResult;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

import java.util.List;
import java.util.Optional;

@Controller
@RequestMapping("/admin")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class AdminWebController {

    private final AdminServiceImpl adminService;
    private final FAQServiceImpl faqService;
    private final DonationService donationService;
    private final DonationRepository donationRepository;
    private final DeliveryService deliveryService;
    private final OrganService organService;

    @GetMapping
    public String root() { return "redirect:/admin/dashboard"; }

    @GetMapping("/dashboard")
    public String dashboard() { return "admin/dashboard"; }

    @GetMapping("/users")
    public String showAllUsers(Model model) {
        List<User> users = adminService.getAllUsers();
        if (users == null || users.isEmpty()) {
            model.addAttribute("users", List.of());  // 빈 리스트라도 넣기
        } else {
            model.addAttribute("users", users);
        }
        return "admin/users-list";
    }

    @GetMapping("/users/delete/{id}")
    public String deleteUser(@PathVariable Long id) {
        adminService.deleteUserById(id);
        return "redirect:/admin/users";
    }

    // FAQ 관리
    @GetMapping("/faqs")
    public String faqList(Model model) {
        List<FAQ> faqs = faqService.getAllFAQs();
        List<FAQ> pendingFAQs = faqService.getPendingFAQs();
        List<FAQ> answeredFAQs = faqService.getAnsweredFAQs();
        model.addAttribute("faqs", faqs);
        model.addAttribute("pendingFAQs", pendingFAQs);
        model.addAttribute("answeredFAQs", answeredFAQs);
        return "admin/faq-list";
    }

    @GetMapping("/faqs/new")
    public String faqForm(@ModelAttribute("form") FAQForm form, Model model) {
        return "admin/faq-form";
    }

    @PostMapping("/faqs")
    public String createFAQ(
            @Valid @ModelAttribute("form") FAQForm form,
            BindingResult bindingResult,
            RedirectAttributes redirectAttributes) {

        if (bindingResult.hasErrors()) {
            return "admin/faq-form";
        }

        faqService.createFAQ(form);
        redirectAttributes.addFlashAttribute("success", "FAQ가 생성되었습니다.");
        return "redirect:/admin/faqs";
    }

    @GetMapping("/faqs/{id}/edit")
    public String editFAQForm(@PathVariable Long id, Model model) {
        FAQ faq = faqService.getFAQById(id);
        FAQForm form = new FAQForm();
        form.setId(faq.getId());
        form.setQuestion(faq.getQuestion());
        form.setAnswer(faq.getAnswer());
        form.setDisplayOrder(faq.getDisplayOrder());
        form.setIsActive(faq.getIsActive());

        model.addAttribute("form", form);
        model.addAttribute("faqId", id);
        return "admin/faq-form";
    }

    @PostMapping("/faqs/{id}/edit")
    public String updateFAQ(
            @PathVariable Long id,
            @Valid @ModelAttribute("form") FAQForm form,
            BindingResult bindingResult,
            RedirectAttributes redirectAttributes) {

        if (bindingResult.hasErrors()) {
            return "admin/faq-form";
        }

        faqService.updateFAQ(id, form);
        redirectAttributes.addFlashAttribute("success", "FAQ가 수정되었습니다.");
        return "redirect:/admin/faqs";
    }

    @PostMapping("/faqs/{id}/delete")
    public String deleteFAQ(@PathVariable Long id, RedirectAttributes redirectAttributes) {
        faqService.deleteFAQ(id);
        redirectAttributes.addFlashAttribute("success", "FAQ가 삭제되었습니다.");
        return "redirect:/admin/faqs";
    }

    @PostMapping("/faqs/{id}/toggle")
    public String toggleFAQ(@PathVariable Long id, RedirectAttributes redirectAttributes) {
        faqService.toggleActive(id);
        redirectAttributes.addFlashAttribute("success", "FAQ 상태가 변경되었습니다.");
        return "redirect:/admin/faqs";
    }

    // FAQ 답변 작성 폼
    @GetMapping("/faqs/{id}/answer")
    public String answerFAQForm(@PathVariable Long id, Model model) {
        FAQ faq = faqService.getFAQById(id);
        if (faq.getAuthor() == null) {
            return "redirect:/admin/faqs";
        }
        model.addAttribute("faq", faq);
        return "admin/faq-answer";
    }

    // FAQ 답변 작성
    @PostMapping("/faqs/{id}/answer")
    public String answerFAQ(
            @PathVariable Long id,
            @RequestParam("answer") String answer,
            RedirectAttributes redirectAttributes) {
        try {
            if (answer == null || answer.trim().isEmpty()) {
                redirectAttributes.addFlashAttribute("error", "답변을 입력해주세요.");
                return "redirect:/admin/faqs/" + id + "/answer";
            }
            faqService.answerFAQ(id, answer.trim());
            redirectAttributes.addFlashAttribute("success", "답변이 작성되었습니다. FAQ에 등록하려면 등록 버튼을 클릭해주세요.");
        } catch (IllegalStateException e) {
            redirectAttributes.addFlashAttribute("error", e.getMessage());
        }
        return "redirect:/admin/faqs";
    }

    // FAQ 등록 (답변이 작성된 FAQ를 FAQ에 등록)
    @PostMapping("/faqs/{id}/register")
    public String registerFAQ(
            @PathVariable Long id,
            RedirectAttributes redirectAttributes) {
        try {
            faqService.registerFAQ(id);
            redirectAttributes.addFlashAttribute("success", "FAQ에 등록되었습니다.");
        } catch (IllegalStateException e) {
            redirectAttributes.addFlashAttribute("error", e.getMessage());
        }
        return "redirect:/admin/faqs";
    }

    // 배송 관리
    @GetMapping("/deliveries")
    public String deliveryList(Model model) {
        List<Delivery> deliveries = deliveryService.getAllDeliveries();
        model.addAttribute("deliveries", deliveries);
        return "admin/delivery-list";
    }

    @GetMapping("/deliveries/create/{donationId}")
    public String deliveryForm(
            @PathVariable Long donationId,
            Model model) {
        
        Donation donation = donationRepository.findById(donationId)
                .orElseThrow(() -> new IllegalArgumentException("기부 정보를 찾을 수 없습니다."));

        // 이미 배송 정보가 있는지 확인
        Optional<Delivery> existingDelivery = deliveryService.getDeliveryByDonation(donation);
        if (existingDelivery.isPresent()) {
            return "redirect:/admin/deliveries/" + existingDelivery.get().getId();
        }

        DeliveryForm form = new DeliveryForm();
        form.setDonationId(donationId);
        
        // 기본값 설정 (발송인 정보는 기부자 정보로)
        if (donation.getDonor() != null) {
            form.setSenderName(donation.getDonor().getName() != null ? donation.getDonor().getName() : "");
            form.setSenderPhone(donation.getDonor().getPhone() != null ? donation.getDonor().getPhone() : "");
            form.setSenderAddress(donation.getDonor().getAddress() != null ? donation.getDonor().getAddress() : "");
        }
        
        // 수령인 정보는 기관 정보로 (기관이 있는 경우)
        if (donation.getOrgan() != null) {
            form.setReceiverName(donation.getOrgan().getOrgName());
        }

        model.addAttribute("form", form);
        model.addAttribute("donation", donation);
        return "admin/delivery-create";
    }

    @PostMapping("/deliveries/create")
    public String createDelivery(
            @Valid @ModelAttribute("form") DeliveryForm form,
            BindingResult bindingResult,
            Model model,
            RedirectAttributes redirectAttributes) {

        if (bindingResult.hasErrors()) {
            Donation donation = donationRepository.findById(form.getDonationId())
                    .orElseThrow(() -> new IllegalArgumentException("기부 정보를 찾을 수 없습니다."));
            model.addAttribute("donation", donation);
            return "admin/delivery-create";
        }

        Donation donation = donationRepository.findById(form.getDonationId())
                .orElseThrow(() -> new IllegalArgumentException("기부 정보를 찾을 수 없습니다."));

        try {
            Delivery delivery = deliveryService.createDelivery(donation, form);
            redirectAttributes.addFlashAttribute("success", "배송 정보가 등록되었습니다.");
            return "redirect:/admin/deliveries/" + delivery.getId();
        } catch (IllegalStateException e) {
            redirectAttributes.addFlashAttribute("error", e.getMessage());
            return "redirect:/admin/deliveries";
        }
    }

    @GetMapping("/deliveries/{deliveryId}")
    public String deliveryDetail(
            @PathVariable Long deliveryId,
            Model model) {

        Delivery delivery = deliveryService.getDeliveryById(deliveryId)
                .orElseThrow(() -> new IllegalArgumentException("배송 정보를 찾을 수 없습니다."));

        model.addAttribute("delivery", delivery);
        return "admin/delivery-detail";
    }

    @GetMapping("/deliveries/{deliveryId}/edit")
    public String editDeliveryForm(
            @PathVariable Long deliveryId,
            Model model) {

        Delivery delivery = deliveryService.getDeliveryById(deliveryId)
                .orElseThrow(() -> new IllegalArgumentException("배송 정보를 찾을 수 없습니다."));

        DeliveryForm form = new DeliveryForm();
        form.setDonationId(delivery.getDonation().getId());
        form.setTrackingNumber(delivery.getTrackingNumber());
        form.setCarrier(delivery.getCarrier());
        form.setSenderName(delivery.getSenderName());
        form.setSenderPhone(delivery.getSenderPhone());
        form.setSenderAddress(delivery.getSenderAddress());
        form.setSenderDetailAddress(delivery.getSenderDetailAddress());
        form.setSenderPostalCode(delivery.getSenderPostalCode());
        form.setReceiverName(delivery.getReceiverName());
        form.setReceiverPhone(delivery.getReceiverPhone());
        form.setReceiverAddress(delivery.getReceiverAddress());
        form.setReceiverDetailAddress(delivery.getReceiverDetailAddress());
        form.setReceiverPostalCode(delivery.getReceiverPostalCode());

        model.addAttribute("form", form);
        model.addAttribute("delivery", delivery);
        return "admin/delivery-edit";
    }

    @PostMapping("/deliveries/{deliveryId}/edit")
    public String updateDelivery(
            @PathVariable Long deliveryId,
            @Valid @ModelAttribute("form") DeliveryForm form,
            BindingResult bindingResult,
            Model model,
            RedirectAttributes redirectAttributes) {

        if (bindingResult.hasErrors()) {
            Delivery delivery = deliveryService.getDeliveryById(deliveryId)
                    .orElseThrow(() -> new IllegalArgumentException("배송 정보를 찾을 수 없습니다."));
            model.addAttribute("delivery", delivery);
            return "admin/delivery-edit";
        }

        deliveryService.updateDelivery(deliveryId, form);
        redirectAttributes.addFlashAttribute("success", "배송 정보가 수정되었습니다.");
        return "redirect:/admin/deliveries/" + deliveryId;
    }

    @PostMapping("/deliveries/{deliveryId}/status")
    public String updateDeliveryStatus(
            @PathVariable Long deliveryId,
            @RequestParam DeliveryStatus status,
            RedirectAttributes redirectAttributes) {

        deliveryService.updateDeliveryStatus(deliveryId, status);
        redirectAttributes.addFlashAttribute("success", "배송 상태가 업데이트되었습니다.");
        return "redirect:/admin/deliveries/" + deliveryId;
    }

    // 매칭된 기부 목록 (배송 정보 등록 가능한 기부)
    @GetMapping("/donations/matched")
    public String matchedDonations(Model model) {
        List<Donation> donations = donationService.getDonationsByStatus(DonationStatus.MATCHED);
        model.addAttribute("donations", donations);
        return "admin/donations-matched";
    }

    // 기부 승인 대기 목록
    @GetMapping("/donations/pending")
    public String pendingDonations(Model model) {
        List<Donation> donations = donationService.getDonationsByStatus(DonationStatus.PENDING);
        List<Organ> organs = organService.findByStatus(OrganStatus.APPROVED);
        model.addAttribute("donations", donations);
        model.addAttribute("organs", organs);
        return "admin/donations-pending";
    }

    @GetMapping("/donations/auto-match")
    public String autoMatchDonations(Model model) {
        List<Donation> donations = donationService.getDonationsByStatus(DonationStatus.REQUESTED).stream()
                .filter(d -> d.getDonationMethod() == DonationMethod.INDIRECT_MATCH && d.getOrgan() == null)
                .toList();
        List<Organ> organs = organService.findByStatus(OrganStatus.APPROVED);
        model.addAttribute("donations", donations);
        model.addAttribute("organs", organs);
        return "admin/donations-auto-match";
    }

    @PostMapping("/donations/{donationId}/assign")
    public String assignDonationToOrgan(
            @PathVariable Long donationId,
            @RequestParam("organId") Long organId,
            @RequestParam(defaultValue = "/admin/donations/pending") String redirect,
            RedirectAttributes redirectAttributes) {
        if (!List.of("/admin/donations/pending", "/admin/donations/auto-match").contains(redirect)) {
            redirect = "/admin/donations/pending";
        }

        try {
            Donation donation = donationService.getDonationById(donationId);
            if (donation.getDonationMethod() != DonationMethod.INDIRECT_MATCH) {
                throw new IllegalArgumentException("간접 매칭 요청이 아닌 기부입니다.");
            }
            Organ organ = organService.findById(organId)
                    .filter(o -> o.getStatus() == OrganStatus.APPROVED)
                    .orElseThrow(() -> new IllegalArgumentException("유효한 기관을 선택해주세요."));
            donationService.assignDonationToOrgan(donationId, organ);
            redirectAttributes.addFlashAttribute("success", "선택한 기관으로 기부를 할당했습니다. 이제 매칭 승인을 진행해주세요.");
        } catch (Exception e) {
            redirectAttributes.addFlashAttribute("error", e.getMessage());
        }

        return "redirect:" + redirect;
    }

    // 간접 매칭 승인 (기관 할당 후 관리자가 승인하여 기관에게 표시)
    @PostMapping("/donations/{donationId}/approve-match")
    public String approveMatch(
            @PathVariable Long donationId,
            RedirectAttributes redirectAttributes) {
        try {
            donationService.approveMatch(donationId);
            redirectAttributes.addFlashAttribute("success", "기부가 승인되어 기관에게 표시되었습니다. 기관에서 최종 승인 여부를 결정합니다.");
        } catch (IllegalStateException | IllegalArgumentException e) {
            redirectAttributes.addFlashAttribute("error", e.getMessage());
        }
        return "redirect:/admin/donations/pending";
    }
    // 기부 승인
    @PostMapping("/donations/{donationId}/approve")
    public String approveDonation(
            @PathVariable Long donationId,
            RedirectAttributes redirectAttributes) {
        try {
            donationService.approveDonation(donationId);
            redirectAttributes.addFlashAttribute("success", "기부가 승인되었습니다.");
        } catch (IllegalStateException | IllegalArgumentException e) {
            redirectAttributes.addFlashAttribute("error", e.getMessage());
        }
        return "redirect:/admin/donations/pending";
    }

    // 기부 반려
    @PostMapping("/donations/{donationId}/reject")
    public String rejectDonation(
            @PathVariable Long donationId,
            RedirectAttributes redirectAttributes) {
        try {
            donationService.rejectDonation(donationId);
            redirectAttributes.addFlashAttribute("success", "기부가 반려되었습니다.");
        } catch (IllegalStateException | IllegalArgumentException e) {
            redirectAttributes.addFlashAttribute("error", e.getMessage());
        }
        return "redirect:/admin/donations/pending";
    }
}
