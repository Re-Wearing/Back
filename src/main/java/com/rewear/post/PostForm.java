package com.rewear.post;

import com.rewear.common.enums.ClothType;
import com.rewear.common.enums.PostType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;
import org.springframework.web.multipart.MultipartFile;

@Data
public class PostForm {

    @NotNull(message = "게시물 타입을 선택해주세요.")
    private PostType postType;

    @NotBlank(message = "제목을 입력해주세요.")
    @Size(max = 200, message = "제목은 200자 이하여야 합니다.")
    private String title;

    @NotBlank(message = "내용을 입력해주세요.")
    private String content;

    // 기관 요청 게시물인 경우
    private ClothType clothType;
    private Integer quantity;

    private MultipartFile image;
}