package com.rewear.faq.dto;

import lombok.Data;

@Data
public class FAQRequestDto {
    private String question;
    private String answer;
    private Integer displayOrder;
    private Boolean isActive;
}

