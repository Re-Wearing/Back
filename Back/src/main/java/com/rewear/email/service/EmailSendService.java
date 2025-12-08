package com.rewear.email.service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailSendService {

    private final JavaMailSender mailSender;

    public void sendEmail(String to, String subject, String body) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, false, StandardCharsets.UTF_8.name());
            
            helper.setFrom("mymp903@gmail.com");
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(body, true); // true = HTML 형식
            
            mailSender.send(message);
            log.info("이메일 발송 성공 - to: {}, subject: {}", to, subject);
        } catch (MessagingException e) {
            log.error("이메일 발송 실패 (MessagingException) - to: {}, subject: {}", to, subject);
            log.error("에러 메시지: {}", e.getMessage());
            log.error("에러 클래스: {}", e.getClass().getName());
            if (e.getCause() != null) {
                log.error("원인: {}", e.getCause().getMessage());
                log.error("원인 클래스: {}", e.getCause().getClass().getName());
            }
            // 스택 트레이스 전체 출력
            java.io.StringWriter sw = new java.io.StringWriter();
            java.io.PrintWriter pw = new java.io.PrintWriter(sw);
            e.printStackTrace(pw);
            log.error("전체 스택 트레이스:\n{}", sw.toString());
            throw new RuntimeException("이메일 발송에 실패했습니다: " + e.getMessage(), e);
        } catch (Exception e) {
            log.error("이메일 발송 실패 (Exception) - to: {}, subject: {}", to, subject);
            log.error("에러 메시지: {}", e.getMessage());
            log.error("에러 클래스: {}", e.getClass().getName());
            // 스택 트레이스 전체 출력
            java.io.StringWriter sw = new java.io.StringWriter();
            java.io.PrintWriter pw = new java.io.PrintWriter(sw);
            e.printStackTrace(pw);
            log.error("전체 스택 트레이스:\n{}", sw.toString());
            throw new RuntimeException("이메일 발송에 실패했습니다: " + e.getMessage(), e);
        }
    }
}
