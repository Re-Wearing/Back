package com.rewear.post.dto;

import com.rewear.common.enums.ClothType;
import com.rewear.common.enums.GenderType;
import com.rewear.common.enums.PostType;
import com.rewear.common.enums.Size;
import lombok.Data;

import java.util.List;

@Data
public class PostRequestDto {
    private PostType postType;
    private String title;
    private String content;
    private List<String> images; // Base64 encoded images
    private Boolean isAnonymous; // 기부 후기용
    private GenderType reqGenderType; // 요청 게시물용
    private ClothType reqMainCategory; // 요청 게시물용
    private String reqDetailCategory; // 요청 게시물용
    private Size reqSize; // 요청 게시물용
}

