package com.rewear.donation.entity;

import com.rewear.common.enums.ClothType;
import com.rewear.common.enums.DeliveryMethod;
import com.rewear.common.enums.DonationMethod;
import com.rewear.common.enums.DonationStatus;
import com.rewear.delivery.entity.Delivery;
import com.rewear.organ.entity.Organ;
import com.rewear.user.entity.User;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "donations")
@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Donation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User donor;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "organ_id", nullable = true)
    private Organ organ;

    @Enumerated(EnumType.STRING)
    @Column(name = "donation_method", nullable = false, length = 20)
    private DonationMethod donationMethod;

    @Enumerated(EnumType.STRING)
    @Column(name = "delivery_method", nullable = false, length = 20)
    private DeliveryMethod deliveryMethod;

    @Enumerated(EnumType.STRING)
    @Column(name = "cloth_type", nullable = false, length = 20)
    private ClothType clothType;

    @Column(name = "is_anonymous", nullable = false)
    private Boolean isAnonymous;

    @Column(name = "image_path", length = 255)
    private String imagePath;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    @Builder.Default
    private DonationStatus status = DonationStatus.REQUESTED;

    @OneToOne(mappedBy = "donation", fetch = FetchType.LAZY, cascade = CascadeType.ALL)
    private Delivery delivery;

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