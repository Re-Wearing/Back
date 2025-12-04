package com.rewear.post.entity;

import com.rewear.common.enums.ClothType;
import com.rewear.common.enums.GenderType;
import com.rewear.common.enums.PostType;
import com.rewear.common.enums.Size;
import com.rewear.organ.entity.Organ;
import com.rewear.user.entity.User;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "posts")
@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Post {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "author_user_id", nullable = true)
    private User authorUser; // 일반 회원 작성자 (기부 후기)

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "author_organ_id", nullable = true)
    private Organ authorOrgan; // 기관 작성자 (요청 게시물)

    // 하위 호환성을 위한 필드 (데이터베이스에 author_id 컬럼이 있는 경우)
    @Column(name = "author_id", nullable = true, insertable = false, updatable = false)
    private Long authorId; // 사용하지 않음 (authorUser 또는 authorOrgan 사용)

    @Enumerated(EnumType.STRING)
    @Column(name = "post_type", nullable = false, length = 20)
    private PostType postType;

    @Column(name = "title", nullable = false, length = 50)
    private String title;

    @Column(name = "content", nullable = false, length = 1000)
    private String content;

    @Column(name = "image_url", length = 255)
    private String imageUrl; // 단일 이미지 (하위 호환성)

    @Column(name = "image_urls", columnDefinition = "TEXT")
    private String imageUrls; // 여러 이미지 (쉼표로 구분)

    @Column(name = "is_anonymous", nullable = false)
    @Builder.Default
    private Boolean isAnonymous = false; // 기부 후기용

    // 요청 게시물 필드
    @Enumerated(EnumType.STRING)
    @Column(name = "req_gender_type", nullable = true, length = 20)
    private GenderType reqGenderType;

    @Enumerated(EnumType.STRING)
    @Column(name = "req_main_category", nullable = true, length = 20)
    private ClothType reqMainCategory;

    @Column(name = "req_detail_category", nullable = true, length = 50)
    private String reqDetailCategory;

    @Enumerated(EnumType.STRING)
    @Column(name = "req_size", nullable = true, length = 10)
    private Size reqSize;

    @Column(name = "view_count", nullable = false)
    @Builder.Default
    private Integer viewCount = 0; // 조회수

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    void onInsert() {
        LocalDateTime now = LocalDateTime.now();
        createdAt = now;
        updatedAt = now;
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}