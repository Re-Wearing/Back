package com.rewear.faq.service;

import com.rewear.faq.FAQForm;
import com.rewear.faq.entity.FAQ;
import com.rewear.faq.repository.FAQRepository;
import com.rewear.user.entity.User;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class FAQServiceImpl implements FAQService {

    private final FAQRepository faqRepository;

    @Override
    @Transactional(readOnly = true)
    public List<FAQ> getAllActiveFAQs() {
        // 공개 FAQ만 반환: 관리자가 작성한 FAQ (author == null) 중 isActive=true인 것만
        List<FAQ> allFAQs = faqRepository.findAll();
        return allFAQs.stream()
                .filter(faq -> {
                    // 관리자가 작성한 FAQ만 (author == null)
                    if (faq.getAuthor() != null) {
                        return false;
                    }
                    // 활성화된 것만
                    return faq.getIsActive();
                })
                .sorted((f1, f2) -> {
                    // displayOrder로 정렬
                    return Integer.compare(f1.getDisplayOrder(), f2.getDisplayOrder());
                })
                .toList();
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

    @Override
    public FAQ createUserQuestion(User user, String question) {
        log.debug("사용자/기관 질문 등록 - 사용자: {}, 질문: {}", user.getUsername(), question);
        
        FAQ faq = FAQ.builder()
                .question(question)
                .answer(null) // 사용자/기관 질문은 답변이 없음
                .author(user)
                .displayOrder(0)
                .isActive(false) // 관리자 답변 전까지 비활성
                .build();
        
        FAQ savedFaq = faqRepository.save(faq);
        log.info("사용자/기관 질문 등록 완료 - ID: {}, 사용자: {}", savedFaq.getId(), user.getUsername());
        return savedFaq;
    }

    @Override
    @Transactional(readOnly = true)
    public List<FAQ> getPendingFAQs() {
        // 답변이 없고 작성자가 있는 FAQ (사용자/기관이 작성한 질문)
        return faqRepository.findAll().stream()
                .filter(faq -> faq.getAuthor() != null)
                .filter(faq -> faq.getAnswer() == null || faq.getAnswer().trim().isEmpty())
                .sorted((f1, f2) -> f2.getCreatedAt().compareTo(f1.getCreatedAt())) // 최신순
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<FAQ> getAnsweredFAQs() {
        // 답변이 작성되었지만 아직 FAQ에 등록되지 않은 FAQ (isActive=false)
        return faqRepository.findAll().stream()
                .filter(faq -> faq.getAuthor() != null)
                .filter(faq -> faq.getAnswer() != null && !faq.getAnswer().trim().isEmpty())
                .filter(faq -> !faq.getIsActive())
                .sorted((f1, f2) -> f2.getUpdatedAt().compareTo(f1.getUpdatedAt())) // 최신순
                .toList();
    }

    @Override
    public FAQ answerFAQ(Long id, String answer) {
        FAQ faq = getFAQById(id);
        
        // 작성자가 있는 FAQ에만 답변 가능
        if (faq.getAuthor() == null) {
            throw new IllegalStateException("관리자가 작성한 FAQ에는 답변을 작성할 수 없습니다.");
        }
        
        // 이미 답변이 있는 경우
        if (faq.getAnswer() != null && !faq.getAnswer().trim().isEmpty()) {
            throw new IllegalStateException("이미 답변이 작성된 FAQ입니다.");
        }
        
        faq.setAnswer(answer);
        // 답변 작성 시에는 아직 활성화하지 않음 (관리자가 별도로 FAQ에 등록해야 함)
        faq.setIsActive(false);
        
        FAQ savedFaq = faqRepository.save(faq);
        log.info("FAQ 답변 작성 완료 - ID: {}, 작성자: {}", savedFaq.getId(), faq.getAuthor().getUsername());
        return savedFaq;
    }

    @Override
    public FAQ registerFAQ(Long id) {
        FAQ faq = getFAQById(id);
        
        // 작성자가 있는 FAQ에만 등록 가능
        if (faq.getAuthor() == null) {
            throw new IllegalStateException("관리자가 작성한 FAQ는 이미 등록되어 있습니다.");
        }
        
        // 답변이 없는 경우 등록 불가
        if (faq.getAnswer() == null || faq.getAnswer().trim().isEmpty()) {
            throw new IllegalStateException("답변이 작성되지 않은 FAQ는 등록할 수 없습니다.");
        }
        
        // 이미 등록된 경우
        if (faq.getIsActive()) {
            throw new IllegalStateException("이미 FAQ에 등록된 항목입니다.");
        }
        
        faq.setIsActive(true);
        FAQ savedFaq = faqRepository.save(faq);
        log.info("FAQ 등록 완료 - ID: {}, 작성자: {}", savedFaq.getId(), faq.getAuthor().getUsername());
        return savedFaq;
    }

    @Override
    @Transactional(readOnly = true)
    public List<FAQ> getUserQuestions(User user) {
        // 사용자가 작성한 모든 질문 반환 (답변 여부와 관계없이)
        return faqRepository.findByAuthorOrderByCreatedAtDesc(user);
    }
}