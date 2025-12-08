package com.rewear.admin.controller;

import com.rewear.faq.FAQForm;
import com.rewear.faq.dto.FAQRequestDto;
import com.rewear.faq.dto.FAQResponseDto;
import com.rewear.faq.entity.FAQ;
import com.rewear.faq.service.FAQService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@RestController
@RequestMapping("/api/admin/faq")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminFAQApiController {

    private final FAQService faqService;

    // 답변 대기 중인 질문 목록 조회
    @GetMapping("/pending")
    public ResponseEntity<?> getPendingFAQs() {
        try {
            log.debug("답변 대기 중인 FAQ 목록 조회 요청");
            List<FAQ> pendingFAQs = faqService.getPendingFAQs();
            
            List<FAQResponseDto> faqDtos = pendingFAQs.stream()
                    .map(this::convertToFAQResponseDto)
                    .collect(Collectors.toList());
            
            log.debug("답변 대기 중인 FAQ 목록 조회 완료 - 개수: {}", faqDtos.size());
            return ResponseEntity.ok(faqDtos);
        } catch (Exception e) {
            log.error("답변 대기 중인 FAQ 목록 조회 실패", e);
            Map<String, Object> error = new HashMap<>();
            error.put("error", "FAQ 목록을 불러오는 중 오류가 발생했습니다: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    // 답변 작성되었지만 미등록 질문 목록 조회
    @GetMapping("/answered")
    public ResponseEntity<?> getAnsweredFAQs() {
        try {
            log.debug("답변 작성되었지만 미등록 FAQ 목록 조회 요청");
            List<FAQ> answeredFAQs = faqService.getAnsweredFAQs();
            
            List<FAQResponseDto> faqDtos = answeredFAQs.stream()
                    .map(this::convertToFAQResponseDto)
                    .collect(Collectors.toList());
            
            log.debug("답변 작성되었지만 미등록 FAQ 목록 조회 완료 - 개수: {}", faqDtos.size());
            return ResponseEntity.ok(faqDtos);
        } catch (Exception e) {
            log.error("답변 작성되었지만 미등록 FAQ 목록 조회 실패", e);
            Map<String, Object> error = new HashMap<>();
            error.put("error", "FAQ 목록을 불러오는 중 오류가 발생했습니다: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    // 모든 FAQ 조회 (관리자용)
    @GetMapping("/all")
    public ResponseEntity<?> getAllFAQs() {
        try {
            log.debug("모든 FAQ 목록 조회 요청");
            List<FAQ> allFAQs = faqService.getAllFAQs();
            
            List<FAQResponseDto> faqDtos = allFAQs.stream()
                    .map(this::convertToFAQResponseDto)
                    .collect(Collectors.toList());
            
            log.debug("모든 FAQ 목록 조회 완료 - 개수: {}", faqDtos.size());
            return ResponseEntity.ok(faqDtos);
        } catch (Exception e) {
            log.error("모든 FAQ 목록 조회 실패", e);
            Map<String, Object> error = new HashMap<>();
            error.put("error", "FAQ 목록을 불러오는 중 오류가 발생했습니다: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    // 공개 FAQ 목록 조회 (관리자용)
    @GetMapping("/published")
    public ResponseEntity<?> getPublishedFAQs() {
        try {
            log.debug("공개 FAQ 목록 조회 요청");
            List<FAQ> publishedFAQs = faqService.getAllActiveFAQs();
            
            List<FAQResponseDto> faqDtos = publishedFAQs.stream()
                    .map(this::convertToFAQResponseDto)
                    .collect(Collectors.toList());
            
            log.debug("공개 FAQ 목록 조회 완료 - 개수: {}", faqDtos.size());
            return ResponseEntity.ok(faqDtos);
        } catch (Exception e) {
            log.error("공개 FAQ 목록 조회 실패", e);
            Map<String, Object> error = new HashMap<>();
            error.put("error", "FAQ 목록을 불러오는 중 오류가 발생했습니다: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    // 모든 사용자 질문 목록 조회 (답변 대기 + 답변 작성됨)
    @GetMapping("/questions")
    public ResponseEntity<?> getAllUserQuestions() {
        try {
            log.debug("모든 사용자 질문 목록 조회 요청");
            List<FAQ> pendingFAQs = faqService.getPendingFAQs();
            List<FAQ> answeredFAQs = faqService.getAnsweredFAQs();
            
            List<FAQResponseDto> allDtos = pendingFAQs.stream()
                    .map(this::convertToFAQResponseDto)
                    .collect(Collectors.toList());
            
            List<FAQResponseDto> answeredDtos = answeredFAQs.stream()
                    .map(this::convertToFAQResponseDto)
                    .collect(Collectors.toList());
            
            allDtos.addAll(answeredDtos);
            
            log.debug("모든 사용자 질문 목록 조회 완료 - 개수: {}", allDtos.size());
            return ResponseEntity.ok(allDtos);
        } catch (Exception e) {
            log.error("모든 사용자 질문 목록 조회 실패", e);
            Map<String, Object> error = new HashMap<>();
            error.put("error", "FAQ 목록을 불러오는 중 오류가 발생했습니다: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    // FAQ 답변 작성
    @PostMapping("/{id}/answer")
    public ResponseEntity<?> answerFAQ(
            @PathVariable Long id,
            @RequestBody Map<String, String> request) {
        try {
            log.debug("FAQ 답변 작성 요청 - ID: {}", id);
            
            String answer = request.get("answer");
            if (answer == null || answer.trim().isEmpty()) {
                Map<String, Object> error = new HashMap<>();
                error.put("error", "답변을 입력해주세요.");
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
            }

            FAQ faq = faqService.answerFAQ(id, answer.trim());
            FAQResponseDto responseDto = convertToFAQResponseDto(faq);
            
            log.info("FAQ 답변 작성 완료 - ID: {}", id);
            return ResponseEntity.ok(responseDto);
        } catch (IllegalStateException e) {
            log.error("FAQ 답변 작성 실패 - ID: {}", id, e);
            Map<String, Object> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
        } catch (IllegalArgumentException e) {
            log.error("FAQ 답변 작성 실패 - ID: {} (FAQ 없음)", id, e);
            Map<String, Object> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error);
        } catch (Exception e) {
            log.error("FAQ 답변 작성 실패 - ID: {}", id, e);
            Map<String, Object> error = new HashMap<>();
            error.put("error", "답변 작성 중 오류가 발생했습니다: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    // FAQ 수정 (관리자용)
    @PutMapping("/{id}")
    public ResponseEntity<?> updateFAQ(
            @PathVariable Long id,
            @RequestBody FAQRequestDto requestDto) {
        try {
            log.debug("FAQ 수정 요청 - ID: {}", id);
            
            if (requestDto.getQuestion() == null || requestDto.getQuestion().trim().isEmpty()) {
                Map<String, Object> error = new HashMap<>();
                error.put("error", "질문을 입력해주세요.");
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
            }
            
            if (requestDto.getAnswer() == null || requestDto.getAnswer().trim().isEmpty()) {
                Map<String, Object> error = new HashMap<>();
                error.put("error", "답변을 입력해주세요.");
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
            }

            FAQForm form = new FAQForm();
            form.setId(id);
            form.setQuestion(requestDto.getQuestion().trim());
            form.setAnswer(requestDto.getAnswer().trim());
            form.setDisplayOrder(requestDto.getDisplayOrder() != null ? requestDto.getDisplayOrder() : 0);
            form.setIsActive(requestDto.getIsActive() != null ? requestDto.getIsActive() : true);

            FAQ faq = faqService.updateFAQ(id, form);
            FAQResponseDto responseDto = convertToFAQResponseDto(faq);
            
            log.info("FAQ 수정 완료 - ID: {}", id);
            return ResponseEntity.ok(responseDto);
        } catch (IllegalArgumentException e) {
            log.error("FAQ 수정 실패 - ID: {} (FAQ 없음)", id, e);
            Map<String, Object> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error);
        } catch (Exception e) {
            log.error("FAQ 수정 실패 - ID: {}", id, e);
            Map<String, Object> error = new HashMap<>();
            error.put("error", "FAQ 수정 중 오류가 발생했습니다: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    // FAQ 삭제 (관리자용)
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteFAQ(@PathVariable Long id) {
        try {
            log.debug("FAQ 삭제 요청 - ID: {}", id);
            
            faqService.deleteFAQ(id);
            
            log.info("FAQ 삭제 완료 - ID: {}", id);
            Map<String, Object> result = new HashMap<>();
            result.put("message", "FAQ가 삭제되었습니다.");
            return ResponseEntity.ok(result);
        } catch (IllegalArgumentException e) {
            log.error("FAQ 삭제 실패 - ID: {} (FAQ 없음)", id, e);
            Map<String, Object> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error);
        } catch (Exception e) {
            log.error("FAQ 삭제 실패 - ID: {}", id, e);
            Map<String, Object> error = new HashMap<>();
            error.put("error", "FAQ 삭제 중 오류가 발생했습니다: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    // 관리자 FAQ 생성 (공개 FAQ 직접 생성)
    @PostMapping
    public ResponseEntity<?> createFAQ(@RequestBody FAQRequestDto requestDto) {
        try {
            log.debug("관리자 FAQ 생성 요청 - 질문: {}", requestDto.getQuestion());
            
            if (requestDto.getQuestion() == null || requestDto.getQuestion().trim().isEmpty()) {
                Map<String, Object> error = new HashMap<>();
                error.put("error", "질문을 입력해주세요.");
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
            }
            
            if (requestDto.getAnswer() == null || requestDto.getAnswer().trim().isEmpty()) {
                Map<String, Object> error = new HashMap<>();
                error.put("error", "답변을 입력해주세요.");
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
            }

            FAQForm form = new FAQForm();
            form.setQuestion(requestDto.getQuestion().trim());
            form.setAnswer(requestDto.getAnswer().trim());
            form.setDisplayOrder(requestDto.getDisplayOrder() != null ? requestDto.getDisplayOrder() : 0);
            form.setIsActive(requestDto.getIsActive() != null ? requestDto.getIsActive() : true);

            FAQ faq = faqService.createFAQ(form);
            FAQResponseDto responseDto = convertToFAQResponseDto(faq);
            
            log.info("관리자 FAQ 생성 완료 - ID: {}", faq.getId());
            return ResponseEntity.status(HttpStatus.CREATED).body(responseDto);
        } catch (Exception e) {
            log.error("관리자 FAQ 생성 실패", e);
            Map<String, Object> error = new HashMap<>();
            error.put("error", "FAQ 생성 중 오류가 발생했습니다: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    // FAQ 등록 (답변이 작성된 FAQ를 공개 FAQ에 등록)
    @PostMapping("/{id}/register")
    public ResponseEntity<?> registerFAQ(@PathVariable Long id) {
        try {
            log.debug("FAQ 등록 요청 - ID: {}", id);
            
            FAQ faq = faqService.registerFAQ(id);
            FAQResponseDto responseDto = convertToFAQResponseDto(faq);
            
            log.info("FAQ 등록 완료 - ID: {}", id);
            return ResponseEntity.ok(responseDto);
        } catch (IllegalStateException e) {
            log.error("FAQ 등록 실패 - ID: {}", id, e);
            Map<String, Object> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
        } catch (IllegalArgumentException e) {
            log.error("FAQ 등록 실패 - ID: {} (FAQ 없음)", id, e);
            Map<String, Object> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error);
        } catch (Exception e) {
            log.error("FAQ 등록 실패 - ID: {}", id, e);
            Map<String, Object> error = new HashMap<>();
            error.put("error", "FAQ 등록 중 오류가 발생했습니다: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    // 모든 활성화된 FAQ를 공개 FAQ로 일괄 변환
    @PostMapping("/publish-all")
    public ResponseEntity<?> publishAllActiveFAQs() {
        try {
            log.info("모든 활성화된 FAQ를 공개 FAQ로 변환 요청");
            
            List<FAQ> allFAQs = faqService.getAllFAQs();
            List<FAQ> publishedFAQs = new ArrayList<>();
            
            for (FAQ faq : allFAQs) {
                // 답변이 있고 활성화되어 있지만 author가 설정된 FAQ를 공개 FAQ로 변환
                if (faq.getAuthor() != null 
                    && faq.getAnswer() != null 
                    && !faq.getAnswer().trim().isEmpty() 
                    && faq.getIsActive()) {
                    try {
                        FAQ published = faqService.publishFAQ(faq.getId());
                        publishedFAQs.add(published);
                        log.info("FAQ ID: {} 공개 완료", faq.getId());
                    } catch (Exception e) {
                        log.warn("FAQ ID: {} 공개 실패: {}", faq.getId(), e.getMessage());
                    }
                }
            }
            
            List<FAQResponseDto> responseDtos = publishedFAQs.stream()
                    .map(this::convertToFAQResponseDto)
                    .collect(Collectors.toList());
            
            log.info("FAQ 일괄 공개 완료 - 변환된 개수: {}", publishedFAQs.size());
            Map<String, Object> result = new HashMap<>();
            result.put("publishedCount", publishedFAQs.size());
            result.put("faqs", responseDtos);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.error("FAQ 일괄 공개 실패", e);
            Map<String, Object> error = new HashMap<>();
            error.put("error", "FAQ 일괄 공개 중 오류가 발생했습니다: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    // FAQ를 공개 FAQ로 변환 (author를 null로 설정하여 관리자 FAQ로 만듦)
    @PostMapping("/{id}/publish")
    public ResponseEntity<?> publishFAQ(@PathVariable Long id) {
        try {
            log.debug("FAQ 공개 요청 - ID: {}", id);
            
            FAQ faq = faqService.publishFAQ(id);
            FAQResponseDto responseDto = convertToFAQResponseDto(faq);
            
            log.info("FAQ 공개 완료 - ID: {}", id);
            return ResponseEntity.ok(responseDto);
        } catch (IllegalStateException e) {
            log.error("FAQ 공개 실패 - ID: {}", id, e);
            Map<String, Object> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
        } catch (IllegalArgumentException e) {
            log.error("FAQ 공개 실패 - ID: {} (FAQ 없음)", id, e);
            Map<String, Object> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error);
        } catch (Exception e) {
            log.error("FAQ 공개 실패 - ID: {}", id, e);
            Map<String, Object> error = new HashMap<>();
            error.put("error", "FAQ 공개 중 오류가 발생했습니다: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    // FAQ 엔티티를 FAQResponseDto로 변환
    private FAQResponseDto convertToFAQResponseDto(FAQ faq) {
        String authorName = null;
        Long authorId = null;
        boolean isUserQuestion = false;

        if (faq.getAuthor() != null) {
            authorName = faq.getAuthor().getUsername();
            authorId = faq.getAuthor().getId();
            isUserQuestion = true;
        }

        return FAQResponseDto.builder()
                .id(faq.getId())
                .question(faq.getQuestion())
                .answer(faq.getAnswer())
                .authorName(authorName)
                .authorId(authorId)
                .displayOrder(faq.getDisplayOrder())
                .isActive(faq.getIsActive())
                .createdAt(faq.getCreatedAt())
                .updatedAt(faq.getUpdatedAt())
                .isUserQuestion(isUserQuestion)
                .build();
    }
}

