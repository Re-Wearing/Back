package com.rewear.donation.util;

import com.rewear.common.enums.ClothType;
import com.rewear.common.enums.DeliveryMethod;
import com.rewear.common.enums.GenderType;
import com.rewear.common.enums.MatchType;
import com.rewear.common.enums.Size;

public class DonationConverter {
    
    /**
     * Front의 물품 종류 문자열을 GenderType으로 변환
     */
    public static GenderType convertItemTypeToGenderType(String itemType) {
        if (itemType == null) {
            throw new IllegalArgumentException("물품 종류가 없습니다.");
        }
        
        return switch (itemType) {
            case "남성 의류" -> GenderType.MALE;
            case "여성 의류" -> GenderType.FEMALE;
            case "아동 의류" -> GenderType.CHILD;
            case "공용 의류" -> GenderType.UNISEX;
            default -> GenderType.UNISEX; // 액세서리리 등은 기본값으로
        };
    }
    
    /**
     * Front의 물품 상세 문자열을 ClothType으로 변환
     */
    public static ClothType convertItemDetailToClothType(String itemDetail) {
        if (itemDetail == null) {
            throw new IllegalArgumentException("물품 상세가 없습니다.");
        }
        
        return switch (itemDetail) {
            case "상의" -> ClothType.TOP;
            case "하의" -> ClothType.BOTTOM;
            case "아우터" -> ClothType.OUTERWEAR;
            case "한 벌 옷" -> ClothType.TOP; // 한 벌 옷은 상의로 분류
            case "기타 의류" -> ClothType.ETC;
            case "시계", "가방", "모자", "장갑", "스카프", "기타 액세서리" -> ClothType.ACCESSORY;
            default -> ClothType.ETC;
        };
    }
    
    /**
     * Front의 사이즈 문자열을 Size enum으로 변환
     */
    public static Size convertItemSizeToSize(String itemSize) {
        if (itemSize == null) {
            throw new IllegalArgumentException("사이즈가 없습니다.");
        }
        
        return switch (itemSize.toUpperCase()) {
            case "S" -> Size.S;
            case "M" -> Size.M;
            case "L" -> Size.L;
            case "XL" -> Size.XL;
            case "XXL" -> Size.XXL;
            case "FREE", "기타 사이즈" -> Size.F;
            default -> Size.F; // 기본값
        };
    }
    
    /**
     * Front의 기부 방법 문자열을 MatchType으로 변환
     */
    public static MatchType convertDonationMethodToMatchType(String donationMethod) {
        if (donationMethod == null) {
            throw new IllegalArgumentException("기부 방법이 없습니다.");
        }
        
        return switch (donationMethod) {
            case "자동 매칭" -> MatchType.INDIRECT;
            case "직접 매칭" -> MatchType.DIRECT;
            default -> throw new IllegalArgumentException("알 수 없는 기부 방법: " + donationMethod);
        };
    }
    
    /**
     * Front의 배송 방법 문자열을 DeliveryMethod로 변환
     */
    public static DeliveryMethod convertDeliveryMethod(String deliveryMethod) {
        if (deliveryMethod == null) {
            throw new IllegalArgumentException("배송 방법이 없습니다.");
        }
        
        return switch (deliveryMethod) {
            case "직접 배송" -> DeliveryMethod.DIRECT_DELIVERY;
            case "택배 배송" -> DeliveryMethod.PARCEL_DELIVERY;
            default -> throw new IllegalArgumentException("알 수 없는 배송 방법: " + deliveryMethod);
        };
    }
}

