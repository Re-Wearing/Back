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

        String subject = "[RE:WEAR] 이메일 인증코드";
        String body = createVerificationEmailHtml(code);
        emailService.sendEmail(email, subject, body);
        log.info("[DEV] email={}, code={}", email, code);
    }

    private String createVerificationEmailHtml(String code) {
        // 간단하고 안전한 HTML 템플릿
        return "<!DOCTYPE html>" +
                "<html>" +
                "<head>" +
                "<meta charset=\"UTF-8\">" +
                "<style>" +
                "body { font-family: Arial, sans-serif; background-color: #f5f5f5; margin: 0; padding: 20px; }" +
                ".container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; padding: 40px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }" +
                ".header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; padding: 30px; text-align: center; border-radius: 12px 12px 0 0; margin: -40px -40px 30px -40px; }" +
                ".header h1 { margin: 0; font-size: 28px; font-weight: 700; }" +
                ".content { text-align: center; }" +
                ".code-box { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; padding: 30px; border-radius: 12px; margin: 30px 0; }" +
                ".code-box .label { font-size: 14px; margin-bottom: 10px; }" +
                ".code-box .code { font-size: 42px; font-weight: 700; letter-spacing: 8px; font-family: monospace; }" +
                ".warning { background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 16px; margin: 30px 0; border-radius: 4px; color: #856404; }" +
                ".footer { text-align: center; color: #999999; font-size: 12px; margin-top: 30px; }" +
                "</style>" +
                "</head>" +
                "<body>" +
                "<div class=\"container\">" +
                "<div class=\"header\">" +
                "<h1>RE:WEAR</h1>" +
                "</div>" +
                "<div class=\"content\">" +
                "<h2 style=\"color: #333; font-size: 24px; margin-bottom: 20px;\">이메일 인증코드</h2>" +
                "<p style=\"color: #666; font-size: 16px; line-height: 1.6; margin-bottom: 30px;\">" +
                "RE:WEAR 회원가입을 위한 인증코드입니다.<br>" +
                "아래 인증코드를 입력하여 이메일 인증을 완료해주세요." +
                "</p>" +
                "<div class=\"code-box\">" +
                "<div class=\"label\">인증코드</div>" +
                "<div class=\"code\">" + code + "</div>" +
                "</div>" +
                "<div class=\"warning\">" +
                "<strong>유효기간:</strong> 이 인증코드는 <strong>10분</strong> 동안만 유효합니다.<br>" +
                "타인에게 공유하지 마시고, 요청하지 않은 인증코드라면 무시해주세요." +
                "</div>" +
                "<p style=\"color: #999; font-size: 13px; line-height: 1.6;\">" +
                "이 이메일은 RE:WEAR 회원가입 과정에서 자동으로 발송되었습니다.<br>" +
                "문의사항이 있으시면 고객센터로 연락주세요." +
                "</p>" +
                "</div>" +
                "<div class=\"footer\">" +
                "© 2025 RE:WEAR. All rights reserved." +
                "</div>" +
                "</div>" +
                "</body>" +
                "</html>";
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
