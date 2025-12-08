package com.rewear.post.dto;

import com.rewear.common.enums.ClothType;
import com.rewear.common.enums.GenderType;
import com.rewear.common.enums.PostType;
import com.rewear.common.enums.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PostResponseDto {
    private Long id;
    private PostType postType;
    private String title;
    private String content;
    private List<ImageDto> images;
    private Boolean isAnonymous;
    private String writer; // 작성자 이름 (익명 처리 포함)
    private String writerType; // "user" or "organ"
    private Long writerId; // 작성자 ID
    private GenderType reqGenderType;
    private ClothType reqMainCategory;
    private String reqDetailCategory;
    private Size reqSize;
    private Integer viewCount;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private Boolean isAuthor; // 현재 사용자가 작성자인지 여부

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ImageDto {
        private String url;
        private String dataUrl;
    }
}

