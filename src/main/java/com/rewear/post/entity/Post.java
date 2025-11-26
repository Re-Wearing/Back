package com.rewear.post.entity;

import com.rewear.common.enums.ClothType;
import com.rewear.common.enums.PostType;
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

    @Enumerated(EnumType.STRING)
    @Column(name = "post_type", nullable = false, length = 20)
    private PostType postType;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "author_id", nullable = false)
    private User author;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "organ_id", nullable = true)
    private Organ organ; // 기관 게시물인 경우

    @Column(name = "title", nullable = false, length = 200)
    private String title;

    @Column(name = "content", nullable = false, columnDefinition = "TEXT")
    private String content;

    @Enumerated(EnumType.STRING)
    @Column(name = "cloth_type", nullable = true, length = 20)
    private ClothType clothType; // 기관 요청 게시물인 경우

    @Column(name = "quantity", nullable = true)
    private Integer quantity; // 기관 요청 게시물인 경우

    @Column(name = "image_path", length = 255)
    private String imagePath;

    @Column(name = "view_count", nullable = false)
    @Builder.Default
    private Integer viewCount = 0;

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

    // 조회수 증가
    public void incrementViewCount() {
        this.viewCount++;
    }
}