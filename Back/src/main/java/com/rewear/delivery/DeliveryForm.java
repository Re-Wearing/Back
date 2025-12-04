package com.rewear.delivery;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

@Data
public class DeliveryForm {

    @NotNull(message = "기부 ID는 필수입니다.")
    private Long donationId;

    private String trackingNumber;

    private String carrier;

    @NotBlank(message = "발송인 이름을 입력해주세요.")
    private String senderName;

    @NotBlank(message = "발송인 전화번호를 입력해주세요.")
    @Pattern(regexp = "^[0-9-]+$", message = "전화번호 형식이 올바르지 않습니다.")
    private String senderPhone;

    @NotBlank(message = "발송인 주소를 입력해주세요.")
    private String senderAddress;

    private String senderDetailAddress;

    private String senderPostalCode;

    @NotBlank(message = "수령인 이름을 입력해주세요.")
    private String receiverName;

    @NotBlank(message = "수령인 전화번호를 입력해주세요.")
    @Pattern(regexp = "^[0-9-]+$", message = "전화번호 형식이 올바르지 않습니다.")
    private String receiverPhone;

    @NotBlank(message = "수령인 주소를 입력해주세요.")
    private String receiverAddress;

    private String receiverDetailAddress;

    private String receiverPostalCode;
}

