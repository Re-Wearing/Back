package com.rewear.user.entity;

import com.rewear.common.enums.Role;
import com.rewear.common.enums.WarnStatus;
import jakarta.persistence.*;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "users")
@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "user_id")
    private Long id; // 사용자 구분 아이디 (P.K., 1부터 순차 증가)

    @Column(nullable = false, unique = true, length = 12)
    @Size(min = 5, max = 12, message = "아이디는 5~12자 사이여야 합니다.")
    private String username; // 아이디

    @Column(nullable = false)
    @NotBlank(message = "비밀번호는 필수입니다.")
    private String password; // 비밀번호 (암호화 저장)

    @Column(nullable = false, length = 50)
    @NotBlank(message = "이름은 필수입니다.")
    private String name; // 이름

    @Column(unique = true, length = 50)
    private String nickname; // 닉네임

    @Column(nullable = false, unique = true, length = 50)
    @Email(message = "올바른 이메일 형식이 아닙니다.")
    @NotBlank(message = "이메일은 필수입니다.")
    private String email; // 이메일

    @Column(nullable = false, length = 20)
    @Pattern(regexp = "^01[0-9]{8,9}$", message = "올바른 휴대전화 번호 형식이 아닙니다.")
    private String phone; // 전화번호

    @Column(nullable = false, length = 10)
    @NotBlank(message = "우편번호는 필수입니다.")
    private String addressPostcode; // 우편번호

    @Column(nullable = false, length = 255)
    @NotBlank(message = "주소는 필수입니다.")
    private String address; // 주소

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "user_roles", joinColumns = @JoinColumn(name = "user_id"))
    @Enumerated(EnumType.STRING)
    @Column(name = "role", length = 20, nullable = false)
    @Builder.Default
    private Set<Role> roles = new HashSet<>(); // 역할

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private WarnStatus status = WarnStatus.NORMAL; // 상태

    @Column(nullable = false)
    @Builder.Default
    private Integer warnCount = 0; // 경고 누적 횟수

    @Column(nullable = false)
    @Builder.Default
    private Integer loginFailCount = 0; // 로그인 실패 횟수

    @Column(nullable = false)
    @Builder.Default
    private Boolean isLocked = false; // 잠금 여부

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt; // 생성일시

    @UpdateTimestamp
    @Column(nullable = false)
    private LocalDateTime updatedAt; // 수정일시

    // === 편의 메서드 ===
    public boolean hasRole(Role r) { return roles != null && roles.contains(r); }
    public void grant(Role r) { if (roles == null) roles = new HashSet<>(); roles.add(r); }
    public void revoke(Role r) { if (roles != null) roles.remove(r); }
}
