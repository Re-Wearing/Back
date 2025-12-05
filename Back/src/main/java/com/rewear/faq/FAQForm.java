package com.rewear.faq;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class FAQForm {
    private Long id;

    @NotBlank(message = "질문을 입력해주세요.")
    @Size(max = 500, message = "질문은 500자 이하여야 합니다.")
    private String question;

    @NotBlank(message = "답변을 입력해주세요.")
    private String answer;

    private Integer displayOrder = 0;

    private Boolean isActive = true;
}