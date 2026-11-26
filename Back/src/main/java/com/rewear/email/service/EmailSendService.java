package com.rewear.email.service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.MailException;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailSendService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username}")
    private String senderAddress;

    public void sendEmail(String to, String subject, String body) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, false, StandardCharsets.UTF_8.name());
            
            helper.setFrom(senderAddress);
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(body, true); // true = HTML 형식
            
            mailSender.send(message);
        } catch (MessagingException | MailException e) {
            log.warn("Email delivery failed ({})", e.getClass().getSimpleName());
            throw new IllegalStateException("이메일 발송에 실패했습니다.");
        }
    }
}
