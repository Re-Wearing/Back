package com.rewear.faq.controller;

import com.rewear.faq.entity.FAQ;
import com.rewear.faq.service.FAQService;
import com.rewear.user.details.CustomUserDetails;
import com.rewear.user.entity.User;
import com.rewear.user.service.UserServiceImpl;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

import java.util.List;

@Slf4j

@Controller
@RequestMapping("/faq")
@RequiredArgsConstructor
public class FAQController {

    private final FAQService faqService;
    private final UserServiceImpl userService;

    @GetMapping
    public String faqList(Model model) {
        List<FAQ> faqs = faqService.getAllActiveFAQs();
        model.addAttribute("faqs", faqs);
        return "faq/list";
    }

    @GetMapping("/{id}")
    public String faqDetail(@PathVariable Long id, Model model) {
        FAQ faq = faqService.getFAQById(id);
        model.addAttribute("faq", faq);
        return "faq/detail";
    }

    // 사용자 질문 등록
    @PostMapping("/question")
    public String submitQuestion(
            @RequestParam("question") String question,
            @AuthenticationPrincipal CustomUserDetails principal,
            RedirectAttributes redirectAttributes) {
        
        try {
            log.debug("사용자 질문 등록 요청 - 사용자: {}, 질문: {}", 
                    principal != null ? principal.getUsername() : "null", question);
            
            if (principal == null) {
                log.warn("사용자 질문 등록 실패 - 로그인 필요");
                redirectAttributes.addFlashAttribute("error", "질문을 등록하려면 로그인이 필요합니다.");
                return "redirect:/login";
            }

            if (question == null || question.trim().isEmpty()) {
                redirectAttributes.addFlashAttribute("error", "질문을 입력해주세요.");
                return "redirect:/faq";
            }

            User user = userService.findByUsername(principal.getUsername())
                    .orElseThrow(() -> new IllegalStateException("사용자를 찾을 수 없습니다."));

            faqService.createUserQuestion(user, question.trim());
            log.info("사용자 질문 등록 완료 - 사용자: {}", principal.getUsername());
            redirectAttributes.addFlashAttribute("success", "질문이 등록되었습니다. 관리자가 답변을 작성하면 FAQ에 추가됩니다.");
        } catch (IllegalStateException e) {
            log.error("사용자 질문 등록 실패 - 사용자 없음", e);
            redirectAttributes.addFlashAttribute("error", "사용자를 찾을 수 없습니다.");
        } catch (Exception e) {
            log.error("사용자 질문 등록 실패 - 예상치 못한 오류", e);
            redirectAttributes.addFlashAttribute("error", "질문 등록 중 오류가 발생했습니다: " + e.getMessage());
        }

        return "redirect:/faq";
    }
}