package com.rewear.donation;

import com.rewear.common.enums.ClothType;
import com.rewear.common.enums.GenderType;
import com.rewear.common.enums.Size;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import org.springframework.web.multipart.MultipartFile;

@Data
public class DonationItemForm {

    @NotNull(message = "성별을 선택해주세요.")
    private GenderType genderType;

    @NotNull(message = "메인 카테고리를 선택해주세요.")
    private ClothType mainCategory;

    @jakarta.validation.constraints.Size(max = 50, message = "상세 카테고리는 최대 50자까지 입력 가능합니다.")
    private String detailCategory;

    @NotNull(message = "사이즈를 선택해주세요.")
    private Size size;

    @jakarta.validation.constraints.Size(max = 500, message = "상세설명은 최대 500자까지 입력 가능합니다.")
    private String description;

    private MultipartFile image;
}

