package com.rewear.faq.controller;

import com.rewear.faq.dto.FAQRequestDto;
import com.rewear.faq.dto.FAQResponseDto;
import com.rewear.faq.entity.FAQ;
import com.rewear.faq.service.FAQService;
import com.rewear.user.details.CustomUserDetails;
import com.rewear.user.entity.User;
import com.rewear.user.service.UserServiceImpl;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@RestController
@RequestMapping("/api/faq")
@RequiredArgsConstructor
public class FAQApiController {

    private final FAQService faqService;
    private final UserServiceImpl userService;

    // 공개 FAQ 목록 조회 (모든 사용자 접근 가능)
    @GetMapping
    public ResponseEntity<?> getFAQs() {
        try {
            log.info("공개 FAQ 목록 조회 요청");
            List<FAQ> faqs = faqService.getAllActiveFAQs();
            
            log.info("서비스에서 반환된 FAQ 개수: {}", faqs.size());
            
            List<FAQResponseDto> faqDtos = faqs.stream()
                    .map(this::convertToFAQResponseDto)
                    .collect(Collectors.toList());
            
            log.info("공개 FAQ 목록 조회 완료 - 개수: {}", faqDtos.size());
            if (faqDtos.isEmpty()) {
                log.warn("공개 FAQ가 없습니다. 관리자가 FAQ를 생성하고 활성화했는지 확인하세요.");
            }
            return ResponseEntity.ok(faqDtos);
        } catch (Exception e) {
            log.error("공개 FAQ 목록 조회 실패", e);
            Map<String, Object> error = new HashMap<>();
            error.put("error", "FAQ 목록을 불러오는 중 오류가 발생했습니다: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    // FAQ 상세 조회 (공개 FAQ만)
    @GetMapping("/{id}")
    public ResponseEntity<?> getFAQ(@PathVariable Long id) {
        try {
            log.debug("FAQ 상세 조회 요청 - ID: {}", id);
            FAQ faq = faqService.getFAQById(id);
            
            // 공개 FAQ만 조회 가능 (관리자가 작성한 FAQ 중 활성화된 것만)
            if (faq.getAuthor() != null || !faq.getIsActive()) {
                log.warn("비공개 FAQ 조회 시도 - ID: {}", id);
                Map<String, Object> error = new HashMap<>();
                error.put("error", "FAQ를 찾을 수 없습니다.");
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error);
            }
            
            FAQResponseDto dto = convertToFAQResponseDto(faq);
            log.debug("FAQ 상세 조회 완료 - ID: {}, 질문: {}", id, faq.getQuestion());
            return ResponseEntity.ok(dto);
        } catch (IllegalArgumentException e) {
            log.error("FAQ 상세 조회 실패 - ID: {}", id, e);
            Map<String, Object> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error);
        } catch (Exception e) {
            log.error("FAQ 상세 조회 실패 - ID: {}", id, e);
            Map<String, Object> error = new HashMap<>();
            error.put("error", "FAQ를 불러오는 중 오류가 발생했습니다: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    // 사용자 질문 등록
    @PostMapping("/question")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> createQuestion(
            @AuthenticationPrincipal CustomUserDetails principal,
            @RequestBody FAQRequestDto requestDto) {
        try {
            log.debug("사용자 질문 등록 요청 - 사용자: {}", 
                    principal != null ? principal.getUsername() : "null");

            if (principal == null) {
                Map<String, Object> error = new HashMap<>();
                error.put("error", "로그인이 필요합니다.");
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(error);
            }

            if (requestDto.getQuestion() == null || requestDto.getQuestion().trim().isEmpty()) {
                Map<String, Object> error = new HashMap<>();
                error.put("error", "질문을 입력해주세요.");
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
            }

            User user = userService.findByUsername(principal.getUsername())
                    .orElseThrow(() -> new IllegalStateException("사용자를 찾을 수 없습니다."));

            FAQ faq = faqService.createUserQuestion(user, requestDto.getQuestion().trim());
            FAQResponseDto responseDto = convertToFAQResponseDto(faq);
            
            log.info("사용자 질문 등록 완료 - ID: {}, 사용자: {}", faq.getId(), principal.getUsername());
            return ResponseEntity.status(HttpStatus.CREATED).body(responseDto);
        } catch (IllegalStateException e) {
            log.error("사용자 질문 등록 실패 - 사용자 없음", e);
            Map<String, Object> error = new HashMap<>();
            error.put("error", "사용자를 찾을 수 없습니다.");
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
        } catch (Exception e) {
            log.error("사용자 질문 등록 실패 - 예상치 못한 오류", e);
            Map<String, Object> error = new HashMap<>();
            error.put("error", "질문 등록 중 오류가 발생했습니다: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    // 내 질문 목록 조회
    @GetMapping("/my-questions")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> getMyQuestions(@AuthenticationPrincipal CustomUserDetails principal) {
        try {
            log.debug("내 질문 목록 조회 요청 - 사용자: {}", 
                    principal != null ? principal.getUsername() : "null");

            if (principal == null) {
                Map<String, Object> error = new HashMap<>();
                error.put("error", "로그인이 필요합니다.");
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(error);
            }

            User user = userService.findByUsername(principal.getUsername())
                    .orElseThrow(() -> new IllegalStateException("사용자를 찾을 수 없습니다."));

            List<FAQ> myQuestions = faqService.getUserQuestions(user);
            List<FAQResponseDto> questionDtos = myQuestions.stream()
                    .map(this::convertToFAQResponseDto)
                    .collect(Collectors.toList());

            log.debug("내 질문 목록 조회 완료 - 사용자: {}, 개수: {}", principal.getUsername(), questionDtos.size());
            return ResponseEntity.ok(questionDtos);
        } catch (IllegalStateException e) {
            log.error("내 질문 목록 조회 실패 - 사용자 없음", e);
            Map<String, Object> error = new HashMap<>();
            error.put("error", "사용자를 찾을 수 없습니다.");
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
        } catch (Exception e) {
            log.error("내 질문 목록 조회 실패 - 예상치 못한 오류", e);
            Map<String, Object> error = new HashMap<>();
            error.put("error", "질문 목록을 불러오는 중 오류가 발생했습니다: " + e.getMessage());
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

