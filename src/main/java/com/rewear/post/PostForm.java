package com.rewear.post;

import com.rewear.common.enums.ClothType;
import com.rewear.common.enums.GenderType;
import com.rewear.common.enums.PostType;
import com.rewear.common.enums.Size;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import org.springframework.web.multipart.MultipartFile;

@Data
public class PostForm {

    @NotNull(message = "게시물 타입을 선택해주세요.")
    private PostType postType;

    @NotBlank(message = "제목을 입력해주세요.")
    @jakarta.validation.constraints.Size(max = 50, message = "제목은 50자 이하여야 합니다.")
    private String title;

    @NotBlank(message = "내용을 입력해주세요.")
    @jakarta.validation.constraints.Size(max = 1000, message = "내용은 1000자 이하여야 합니다.")
    private String content;

    private MultipartFile image;

    // 기부 후기용
    private Boolean isAnonymous = false;

    // 요청 게시물용
    private GenderType reqGenderType;
    private ClothType reqMainCategory;
    
    @jakarta.validation.constraints.Size(max = 50, message = "상세 카테고리는 50자 이하여야 합니다.")
    private String reqDetailCategory;
    private Size reqSize;
}