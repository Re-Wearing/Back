package com.rewear.organ.dto;

import com.rewear.common.enums.OrganStatus;
import com.rewear.organ.entity.Organ;
import lombok.Builder;

@Builder
public record OrganSummaryResponse(
        Long id,
        String name,
        String businessNo,
        OrganStatus status
) {
    public static OrganSummaryResponse from(Organ organ) {
        return OrganSummaryResponse.builder()
                .id(organ.getId())
                .name(organ.getOrgName())
                .businessNo(organ.getBusinessNo())
                .status(organ.getStatus())
                .build();
    }
}

