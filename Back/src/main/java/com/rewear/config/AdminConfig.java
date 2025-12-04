package com.rewear.config;

import com.rewear.common.enums.Role;
import com.rewear.user.entity.User;
import com.rewear.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.EnumSet;
import java.util.HashSet;
import java.util.Set;

@Slf4j
@Component
@RequiredArgsConstructor
@Order(1) // 가장 먼저 실행
public class AdminConfig implements ApplicationRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${rewear.admin.username:admin}")
    private String adminUsername;

    @Value("${rewear.admin.password:admin}")
    private String adminPassword;

    /** 개발 편의를 위해 필요할 때만 비밀번호를 초기화 */
    @Value("${rewear.admin.reset-password:false}")
    private boolean resetPassword;

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        userRepository.findByUsername(adminUsername).ifPresentOrElse(u -> {
            boolean changed = false;

            // Set<Role> 보정: ADMIN 권한이 없다면 추가
            Set<Role> roles = u.getRoles();
            if (roles == null) {
                roles = new HashSet<>();
            }
            if (!roles.contains(Role.ADMIN)) {
                roles.add(Role.ADMIN);
                u.setRoles(roles);
                changed = true;
            }

            // 필요 시 비밀번호 재설정(항상 재인코딩을 피하고, 옵션으로만)
            if (resetPassword) {
                u.setPassword(passwordEncoder.encode(adminPassword));
                changed = true;
            }

            if (changed) {
                userRepository.save(u);
                log.info("Updated admin user '{}': roles/password synced", adminUsername);
            } else {
                log.info("Admin user '{}' already up-to-date", adminUsername);
            }
        }, () -> {
            // 새로 생성
            User admin = new User();
            admin.setUsername(adminUsername);
            admin.setPassword(passwordEncoder.encode(adminPassword));
            admin.setName("admin");
            admin.setEmail("mymp903@gmail.com");
            admin.setNickname("관리자");
            admin.setPhone("01000000000");
            admin.setAddressPostcode("00000");
            admin.setAddress("관리자 주소");

            // ✅ Set<Role>로 권한 부여
            admin.setRoles(EnumSet.of(Role.ADMIN));

            userRepository.save(admin);
            log.info("Seeded admin user '{}'", adminUsername);
        });
    }
}
