package com.rewear.user.entity;

import com.rewear.common.enums.Role;
import jakarta.persistence.*;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.*;
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
    private Long id; // 기본 키 (자동 증가)

    @Column(nullable = false, unique = true, length = 12)
    @Size(min = 5, max = 12, message = "아이디는 5~12자 사이여야 합니다.")
    private String username; // 아이디

    @Column(nullable = false)
    @NotBlank(message = "비밀번호는 필수입니다.")
    private String password; // 비밀번호 (암호화 저장 권장)

    @Column(nullable = false, length = 50)
    @NotBlank(message = "이름은 필수입니다.")
    private String name; // 이름

    @Column(nullable = false, unique = true, length = 100)
    @Email(message = "올바른 이메일 형식이 아닙니다.")
    @NotBlank(message = "이메일은 필수입니다.")
    private String email; // 이메일

    @Column(nullable = false, length = 15)
    @Pattern(regexp = "^01[0-9]{8,9}$", message = "올바른 휴대전화 번호 형식이 아닙니다.")
    private String phone; // 휴대전화

    @Column(length = 255)
    private String address; // 주소

    @Column(unique = true, length = 50)
    private String nickname; // 닉네임

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "user_roles", joinColumns = @JoinColumn(name = "user_id"))
    @Enumerated(EnumType.STRING)
    @Column(name = "role", length = 20, nullable = false)
    @Builder.Default
    private Set<Role> roles = new HashSet<>();

    // === 편의 메서드(선택) ===
    public boolean hasRole(Role r) { return roles != null && roles.contains(r); }
    public void grant(Role r) { if (roles == null) roles = new HashSet<>(); roles.add(r); }
    public void revoke(Role r) { if (roles != null) roles.remove(r); }
}
