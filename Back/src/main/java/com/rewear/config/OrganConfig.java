package com.rewear.config;

import com.rewear.common.enums.OrganStatus;
import com.rewear.common.enums.Role;
import com.rewear.organ.entity.Organ;
import com.rewear.organ.repository.OrganRepository;
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
@Order(3) // UserConfig 이후 실행
public class OrganConfig implements ApplicationRunner {

    private final UserRepository userRepository;
    private final OrganRepository organRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${rewear.organ.username:organ}")
    private String organUsername;

    @Value("${rewear.organ.password:organ}")
    private String organPassword;

    @Value("${rewear.organ.business-no:1234567890}")
    private String businessNo;

    @Value("${rewear.organ.org-name:테스트 기관}")
    private String orgName;

    @Value("${rewear.organ.reset-password:false}")
    private boolean resetPassword;

    @Value("${rewear.organ.auto-approve:true}")
    private boolean autoApprove; // 자동 승인 여부

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        userRepository.findByUsername(organUsername).ifPresentOrElse(u -> {
            boolean changed = false;

            // ORGAN 권한 확인 및 추가
            if (u.getRoles() == null || !u.getRoles().contains(Role.ORGAN)) {
                u.setRoles(EnumSet.of(Role.ORGAN));
                changed = true;
            }

            // 필요 시 비밀번호 재설정
            if (resetPassword) {
                u.setPassword(passwordEncoder.encode(organPassword));
                changed = true;
            }

            if (changed) {
                userRepository.save(u);
                log.info("Updated organ user '{}': roles/password synced", organUsername);
            }

            // Organ 엔티티 확인 및 생성
            organRepository.findByUserId(u.getId()).ifPresentOrElse(organ -> {
                // 이미 Organ이 존재하는 경우 상태 확인
                if (autoApprove && organ.getStatus() != OrganStatus.APPROVED) {
                    organ.setStatus(OrganStatus.APPROVED);
                    organRepository.save(organ);
                    log.info("Auto-approved organ for user '{}'", organUsername);
                } else {
                    log.info("Organ for user '{}' already exists with status: {}", organUsername, organ.getStatus());
                }
            }, () -> {
                // Organ이 없는 경우 생성
                Organ organ = Organ.builder()
                        .user(u)
                        .businessNo(businessNo)
                        .orgName(orgName)
                        .status(autoApprove ? OrganStatus.APPROVED : OrganStatus.PENDING)
                        .build();
                organRepository.save(organ);
                log.info("Created organ for user '{}' with status: {}", organUsername, organ.getStatus());
            });
        }, () -> {
            // 새로 생성
            User organUser = new User();
            organUser.setUsername(organUsername);
            organUser.setPassword(passwordEncoder.encode(organPassword));
            organUser.setName("기관 담당자");
            organUser.setEmail("organ@example.com");
            organUser.setNickname("리웨어");  // 한글 닉네임
            organUser.setPhone("01098765432");
            organUser.setAddressPostcode("06626");
            organUser.setAddress("서울시 서초구 서초대로 456");

            // ORGAN 권한 부여
            organUser.setRoles(EnumSet.of(Role.ORGAN));

            User savedUser = userRepository.save(organUser);
            log.info("Seeded organ user '{}'", organUsername);

            // Organ 엔티티 생성
            Organ organ = Organ.builder()
                    .user(savedUser)
                    .businessNo(businessNo)
                    .orgName(orgName)
                    .status(autoApprove ? OrganStatus.APPROVED : OrganStatus.PENDING)
                    .build();
            organRepository.save(organ);
            log.info("Created organ for user '{}' with status: {}", organUsername, organ.getStatus());
        });
    }
}

