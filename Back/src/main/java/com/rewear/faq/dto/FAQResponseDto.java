package com.rewear.faq.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FAQResponseDto {
    private Long id;
    private String question;
    private String answer;
    private String authorName; // 작성자 이름 (null이면 관리자)
    private Long authorId; // 작성자 ID (null이면 관리자)
    private Integer displayOrder;
    private Boolean isActive;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private Boolean isUserQuestion; // 사용자 질문인지 여부 (author != null)
}

