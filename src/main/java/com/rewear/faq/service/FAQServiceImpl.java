package com.rewear.faq.service;

import com.rewear.faq.FAQForm;
import com.rewear.faq.entity.FAQ;
import com.rewear.faq.repository.FAQRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class FAQServiceImpl implements FAQService {

    private final FAQRepository faqRepository;

    @Override
    @Transactional(readOnly = true)
    public List<FAQ> getAllActiveFAQs() {
        return faqRepository.findByIsActiveTrueOrderByCategoryAscDisplayOrderAsc();
    }

    @Override
    @Transactional(readOnly = true)
    public List<FAQ> getFAQsByCategory(String category) {
        return faqRepository.findByCategoryAndIsActiveTrueOrderByDisplayOrderAsc(category);
    }

    @Override
    @Transactional(readOnly = true)
    public FAQ getFAQById(Long id) {
        return faqRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("FAQ를 찾을 수 없습니다."));
    }

    @Override
    @Transactional(readOnly = true)
    public List<FAQ> getAllFAQs() {
        return faqRepository.findAll();
    }

    @Override
    public FAQ createFAQ(FAQForm form) {
        FAQ faq = FAQ.builder()
                .question(form.getQuestion())
                .answer(form.getAnswer())
                .category(form.getCategory() != null && !form.getCategory().isEmpty()
                        ? form.getCategory() : "기타")
                .displayOrder(form.getDisplayOrder() != null ? form.getDisplayOrder() : 0)
                .isActive(form.getIsActive() != null ? form.getIsActive() : true)
                .build();
        return faqRepository.save(faq);
    }

    @Override
    public FAQ updateFAQ(Long id, FAQForm form) {
        FAQ faq = getFAQById(id);
        faq.setQuestion(form.getQuestion());
        faq.setAnswer(form.getAnswer());
        faq.setCategory(form.getCategory() != null && !form.getCategory().isEmpty()
                ? form.getCategory() : "기타");
        faq.setDisplayOrder(form.getDisplayOrder() != null ? form.getDisplayOrder() : 0);
        faq.setIsActive(form.getIsActive() != null ? form.getIsActive() : true);
        return faqRepository.save(faq);
    }

    @Override
    public void deleteFAQ(Long id) {
        FAQ faq = getFAQById(id);
        faqRepository.delete(faq);
    }

    @Override
    public void toggleActive(Long id) {
        FAQ faq = getFAQById(id);
        faq.setIsActive(!faq.getIsActive());
        faqRepository.save(faq);
    }
}