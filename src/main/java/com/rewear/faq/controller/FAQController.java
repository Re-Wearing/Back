package com.rewear.faq.controller;

import com.rewear.faq.entity.FAQ;
import com.rewear.faq.service.FAQService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Controller
@RequestMapping("/faq")
@RequiredArgsConstructor
public class FAQController {

    private final FAQService faqService;

    @GetMapping
    public String faqList(
            @RequestParam(value = "category", required = false) String category,
            Model model) {

        List<FAQ> faqs;
        if (category != null && !category.isEmpty()) {
            faqs = faqService.getFAQsByCategory(category);
        } else {
            faqs = faqService.getAllActiveFAQs();
        }

        // 카테고리별로 그룹화
        Map<String, List<FAQ>> faqsByCategory = faqs.stream()
                .collect(Collectors.groupingBy(
                        faq -> faq.getCategory() != null ? faq.getCategory() : "기타"
                ));

        model.addAttribute("faqsByCategory", faqsByCategory);
        model.addAttribute("selectedCategory", category);

        // 모든 카테고리 목록
        List<String> categories = faqs.stream()
                .map(FAQ::getCategory)
                .filter(cat -> cat != null && !cat.isEmpty())
                .distinct()
                .sorted()
                .collect(Collectors.toList());
        model.addAttribute("categories", categories);

        return "faq/list";
    }

    @GetMapping("/{id}")
    public String faqDetail(@PathVariable Long id, Model model) {
        FAQ faq = faqService.getFAQById(id);
        model.addAttribute("faq", faq);
        return "faq/detail";
    }
}