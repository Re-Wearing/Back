package com.rewear.donation.dto;

import com.rewear.common.enums.ClothType;
import com.rewear.common.enums.DeliveryMethod;
import com.rewear.common.enums.GenderType;
import com.rewear.common.enums.MatchType;
import com.rewear.common.enums.Size;
import com.rewear.donation.DonationForm;
import com.rewear.donation.DonationItemForm;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@Data
public class DonationApplyRequest {

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
    private List<MultipartFile> images;

    @NotNull(message = "매칭 방식을 선택해주세요.")
    private MatchType matchType;

    private Long organId;

    @NotNull(message = "배송 방법을 선택해주세요.")
    private DeliveryMethod deliveryMethod;

    @NotNull(message = "익명 여부를 선택해주세요.")
    private Boolean isAnonymous;

    public DonationItemForm toItemForm() {
        DonationItemForm form = new DonationItemForm();
        form.setGenderType(this.genderType);
        form.setMainCategory(this.mainCategory);
        form.setDetailCategory(this.detailCategory);
        form.setSize(this.size);
        form.setDescription(this.description);
        form.setImages(this.images);
        form.setImage(this.image);
        return form;
    }

    public DonationForm toDonationForm() {
        DonationForm form = new DonationForm();
        form.setMatchType(this.matchType);
        form.setOrganId(this.organId);
        form.setDeliveryMethod(this.deliveryMethod);
        form.setIsAnonymous(this.isAnonymous);
        return form;
    }
}

