package com.rewear.donation.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.List;

@Data
public class DonationRequestDto {
    
    // 물품 정보
    @NotBlank(message = "물품 종류를 선택해주세요.")
    private String itemType; // '남성 의류', '여성 의류', '아동 의류', '공용 의류', '액세서리리'
    
    @NotBlank(message = "물품 상세를 선택해주세요.")
    private String itemDetail; // '상의', '하의', '아우터' 등
    
    @NotBlank(message = "물품 사이즈를 선택해주세요.")
    private String itemSize; // 'S', 'M', 'L', 'XL', 'XXL', 'FREE', '기타 사이즈'
    
    @NotBlank(message = "물품 상태 정보를 선택해주세요.")
    private String itemCondition; // '새상품', '사용감 적음', '사용감 보통', '사용감 많음'
    
    @NotBlank(message = "물품 상세 정보를 입력해주세요.")
    private String itemDescription;
    
    // 기부 방법 정보
    @NotBlank(message = "기부 방법을 선택해주세요.")
    private String donationMethod; // '자동 매칭', '직접 매칭'
    
    private Long donationOrganizationId; // 직접 매칭인 경우 필수
    
    private String donationOrganizationName; // 직접 매칭인 경우
    
    @NotBlank(message = "배송 방법을 선택해주세요.")
    private String deliveryMethod; // '직접 배송', '택배 배송'
    
    @NotNull(message = "익명 여부를 선택해주세요.")
    private Boolean isAnonymous;
    
    @NotBlank(message = "연락처를 입력해주세요.")
    private String contact;
    
    private String desiredDate; // 희망일 (택배 배송인 경우)
    
    private String memo; // 메모
    
    private List<String> images; // base64 이미지 배열
}

