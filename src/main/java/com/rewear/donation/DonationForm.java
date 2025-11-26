package com.rewear.donation;

import com.rewear.common.enums.ClothType;
import com.rewear.common.enums.DeliveryMethod;
import com.rewear.common.enums.DonationMethod;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import org.springframework.web.multipart.MultipartFile;

@Data
public class DonationForm {

    @NotNull(message = "기부 방법을 선택해주세요.")
    private DonationMethod donationMethod;

    @NotNull(message = "기관을 선택해주세요.")
    private Long organId;

    @NotNull(message = "배송 방법을 선택해주세요.")
    private DeliveryMethod deliveryMethod;

    @NotNull(message = "옷의 종류를 선택해주세요.")
    private ClothType clothType;

    @NotNull(message = "익명 여부를 선택해주세요.")
    private Boolean isAnonymous;

    private MultipartFile image;
}