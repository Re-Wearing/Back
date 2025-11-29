package com.rewear.faq.service;

import com.rewear.faq.FAQForm;
import com.rewear.faq.entity.FAQ;

import java.util.List;

public interface FAQService {
    List<FAQ> getAllActiveFAQs();
    List<FAQ> getFAQsByCategory(String category);
    FAQ getFAQById(Long id);

    // 관리자용 메서드
    List<FAQ> getAllFAQs();
    FAQ createFAQ(FAQForm form);
    FAQ updateFAQ(Long id, FAQForm form);
    void deleteFAQ(Long id);
    void toggleActive(Long id);
}