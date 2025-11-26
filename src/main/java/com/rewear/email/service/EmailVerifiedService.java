package com.rewear.email.service;

import com.rewear.email.EmailVerification;
import com.rewear.email.Repository.EmailVerificationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;

@Slf4j
@Service
@RequiredArgsConstructor
public class EmailVerifiedService {

    private final EmailVerificationRepository repo;
    private final EmailSendService emailService;
    private static final SecureRandom RND = new SecureRandom();

    private String random6() {
        int n = RND.nextInt(900000) + 100000; // 100000~999999
        return String.valueOf(n);
    }

    @Transactional
    public void sendVerificationCode(String email) {
        String code = random6();
        LocalDateTime now = LocalDateTime.now();
        EmailVerification ev = EmailVerification.builder()
                .email(email)
                .code(code)
                .verified(false)
                .createdAt(now)
                .expiresAt(now.plusMinutes(10))
                .build();
        repo.save(ev);

        String subject = "[RE-WEAR] 이메일 인증코드";
        String body = "인증코드: " + code + "\n10분 이내에 입력해주세요.";
        emailService.sendEmail(email, subject, body);
        log.info("[DEV] email={}, code={}", email, code);
    }

    @Transactional
    public boolean verifyCode(String email, String code) {
        var opt = repo.findTopByEmailOrderByCreatedAtDesc(email);
        if (opt.isEmpty()) return false;
        var ev = opt.get();

        if (ev.isVerified()) return true;
        if (LocalDateTime.now().isAfter(ev.getExpiresAt())) return false;
        if (!ev.getCode().equals(code)) return false;

        ev.setVerified(true);
        // JPA 변경감지로 update
        return true;
    }

    @Transactional(readOnly = true)
    public boolean isEmailVerified(String email) {
        return repo.findTopByEmailOrderByCreatedAtDesc(email)
                .filter(EmailVerification::isVerified)
                .filter(ev -> LocalDateTime.now().isBefore(ev.getExpiresAt()))
                .isPresent();
    }
}
