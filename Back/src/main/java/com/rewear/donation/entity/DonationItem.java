package com.rewear.donation.entity;

import com.rewear.common.enums.ClothType;
import com.rewear.common.enums.GenderType;
import com.rewear.common.enums.Size;
import com.rewear.user.entity.User;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "donation_items")
@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DonationItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "donation_item_id")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "owner_id", nullable = false)
    private User owner;

    @Enumerated(EnumType.STRING)
    @Column(name = "gender_type", nullable = false, length = 20)
    private GenderType genderType;

    @Enumerated(EnumType.STRING)
    @Column(name = "main_category", nullable = false, length = 20)
    private ClothType mainCategory;

    @Column(name = "detail_category", length = 50)
    private String detailCategory;

    @Enumerated(EnumType.STRING)
    @Column(name = "size", nullable = false, length = 10)
    private Size size;

    @Column(name = "description", length = 500)
    private String description;

    @Column(name = "image_url", length = 255)
    private String imageUrl; // 단일 이미지 (하위 호환성)

    @Column(name = "image_urls", columnDefinition = "TEXT")
    private String imageUrls; // 여러 이미지 (쉼표로 구분)

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
}

