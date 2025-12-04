package com.rewear.organ.entity;

import com.rewear.common.enums.OrganStatus;
import com.rewear.user.entity.User;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity @Table(name = "organs",
        uniqueConstraints = {
                @UniqueConstraint(name="uk_organ_user", columnNames = "user_id"),
                @UniqueConstraint(name="uk_organ_business_no", columnNames = "business_no")
        }
)
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Organ {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // USER(ORGAN 역할) 1:1
    @OneToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name="business_no", nullable = false, length = 20) // 숫자 10자리면 length=10도 OK
    private String businessNo;

    @Column(name="org_name", nullable = false, length = 100)
    private String orgName;

    @Enumerated(EnumType.STRING)
    @Column(name="status", nullable = false, length = 16)
    private OrganStatus status;

    @Column(name="created_at", nullable=false)
    private LocalDateTime createdAt;

    @Column(name="updated_at", nullable=false)
    private LocalDateTime updatedAt;

    @PrePersist
    void onInsert() {
        LocalDateTime now = LocalDateTime.now();
        createdAt = now;
        updatedAt = now;
    }
    @PreUpdate
    void onUpdate() { updatedAt = LocalDateTime.now(); }
}
