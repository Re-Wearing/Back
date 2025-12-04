package com.rewear.donation.entity;

import com.rewear.common.enums.AdminDecision;
import com.rewear.common.enums.DeliveryMethod;
import com.rewear.common.enums.DonationStatus;
import com.rewear.common.enums.MatchType;
import com.rewear.delivery.entity.Delivery;
import com.rewear.organ.entity.Organ;
import com.rewear.user.entity.User;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

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
    @Column(name = "donation_id")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "donor_id", nullable = false)
    private User donor;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "organ_id", nullable = true)
    private Organ organ;

    // 기부물품과 1:1 관계
    @OneToOne(fetch = FetchType.LAZY, cascade = CascadeType.ALL, orphanRemoval = true)
    @JoinColumn(name = "donation_item_id", nullable = false, unique = true)
    private DonationItem donationItem;

    @Enumerated(EnumType.STRING)
    @Column(name = "match_type", nullable = false, length = 20)
    private MatchType matchType;

    @Enumerated(EnumType.STRING)
    @Column(name = "delivery_method", nullable = false, length = 20)
    private DeliveryMethod deliveryMethod;

    @Column(name = "is_anonymous", nullable = false)
    private Boolean isAnonymous;

    @Enumerated(EnumType.STRING)
    @Column(name = "admin_decision", nullable = false, length = 20)
    @Builder.Default
    private AdminDecision adminDecision = AdminDecision.PENDING;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    @Builder.Default
    private DonationStatus status = DonationStatus.PENDING;

    @Column(name = "cancel_reason", length = 255)
    private String cancelReason;

    @OneToOne(mappedBy = "donation", fetch = FetchType.LAZY, cascade = CascadeType.ALL)
    private Delivery delivery;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
}