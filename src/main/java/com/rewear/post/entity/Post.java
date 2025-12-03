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
    @Column(name = "post_id")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "author_user_id", nullable = true)
    private User authorUser; // 일반 회원 작성자 (기부 후기)

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "author_organ_id", nullable = true)
    private Organ authorOrgan; // 기관 작성자 (요청 게시물)

    @Enumerated(EnumType.STRING)
    @Column(name = "post_type", nullable = false, length = 20)
    private PostType postType;

    @Column(name = "title", nullable = false, length = 50)
    private String title;

    @Column(name = "content", nullable = false, length = 1000)
    private String content;

    @Column(name = "image_url", length = 255)
    private String imageUrl;

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