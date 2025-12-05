package com.rewear.donation;

import com.rewear.common.enums.DeliveryMethod;
import com.rewear.common.enums.MatchType;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class DonationForm {

    @NotNull(message = "매칭 방식을 선택해주세요.")
    private MatchType matchType;

    // 직접 매칭 시 필수, 간접 매칭 시 선택 사항
    private Long organId;

    @NotNull(message = "배송 방법을 선택해주세요.")
    private DeliveryMethod deliveryMethod;

    @NotNull(message = "익명 여부를 선택해주세요.")
    private Boolean isAnonymous;

    // 직접 매칭인 경우 기관 선택 필수 검증
    public boolean isOrganRequired() {
        return matchType == MatchType.DIRECT;
    }
}