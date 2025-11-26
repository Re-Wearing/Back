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

@Slf4j
@Component
@RequiredArgsConstructor
@Order(2) // AdminConfig 이후 실행
public class UserConfig implements ApplicationRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${rewear.user.username:user}")
    private String userUsername;

    @Value("${rewear.user.password:user}")
    private String userPassword;

    @Value("${rewear.user.reset-password:false}")
    private boolean resetPassword;

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        userRepository.findByUsername(userUsername).ifPresentOrElse(u -> {
            boolean changed = false;

            // USER 권한 확인 및 추가
            if (u.getRoles() == null || !u.getRoles().contains(Role.USER)) {
                u.setRoles(EnumSet.of(Role.USER));
                changed = true;
            }

            // 필요 시 비밀번호 재설정
            if (resetPassword) {
                u.setPassword(passwordEncoder.encode(userPassword));
                changed = true;
            }

            if (changed) {
                userRepository.save(u);
                log.info("Updated user '{}': roles/password synced", userUsername);
            } else {
                log.info("User '{}' already up-to-date", userUsername);
            }
        }, () -> {
            // 새로 생성
            User user = new User();
            user.setUsername(userUsername);
            user.setPassword(passwordEncoder.encode(userPassword));
            user.setName("일반 사용자");
            user.setEmail("user@example.com");
            user.setNickname("user");
            user.setPhone("01012345678");
            user.setAddress("서울시 강남구 테헤란로 123");

            // USER 권한 부여
            user.setRoles(EnumSet.of(Role.USER));

            userRepository.save(user);
            log.info("Seeded user '{}'", userUsername);
        });
    }
}

