package com.rewear.faq.service;

import com.rewear.faq.FAQForm;
import com.rewear.faq.entity.FAQ;

import java.util.List;

import com.rewear.user.entity.User;

public interface FAQService {
    List<FAQ> getAllActiveFAQs(); // 공개 FAQ만 반환 (관리자 작성)
    FAQ getFAQById(Long id);

    // 사용자/기관 질문 등록
    FAQ createUserQuestion(User user, String question);
    
    // 사용자별 질문 조회
    List<FAQ> getUserQuestions(User user);

    // 관리자용 메서드
    List<FAQ> getAllFAQs();
    List<FAQ> getPendingFAQs(); // 답변 대기 중인 FAQ 목록
    List<FAQ> getAnsweredFAQs(); // 답변은 작성되었지만 아직 FAQ에 등록되지 않은 목록
    FAQ createFAQ(FAQForm form);
    FAQ updateFAQ(Long id, FAQForm form);
    FAQ answerFAQ(Long id, String answer); // FAQ에 답변 작성 (아직 등록되지 않음)
    FAQ registerFAQ(Long id); // 답변이 작성된 FAQ를 FAQ에 등록 (활성화)
    void deleteFAQ(Long id);
    void toggleActive(Long id);
}