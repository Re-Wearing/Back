package com.rewear.config;

import java.util.Properties;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.JavaMailSenderImpl;

/**
 * JavaMailSender 빈을 직접 구성하는 설정 클래스
 * application.properties (또는 yml)의 spring.mail.* 값들을 사용합니다.
 */
@Configuration
public class MailConfig {

    // application.properties에서 값을 주입받습니다.
    // ':' 뒤에 기본값을 추가하여, 프로퍼티 파일에 값이 없어도 오류가 나지 않도록 수정
    @Value("${spring.mail.host:smtp.gmail.com}")
    private String host;

    @Value("${spring.mail.port:587}")
    private int port;

    @Value("${spring.mail.username}") // username/password는 민감 정보라 기본값 X
    private String username;

    @Value("${spring.mail.password}") // username/password는 민감 정보라 기본값 X
    private String password;

    // application.properties에서 설정한 추가 속성값들
    @Value("${spring.mail.properties.mail.smtp.auth:true}")
    private String auth;

    @Value("${spring.mail.properties.mail.smtp.starttls.enable:true}")
    private String starttlsEnable;

    @Value("${spring.mail.properties.mail.smtp.connectiontimeout:5000}")
    private String connectionTimeout;

    @Value("${spring.mail.properties.mail.smtp.timeout:5000}")
    private String timeout;

    @Value("${spring.mail.properties.mail.smtp.writetimeout:5000}")
    private String writeTimeout;

    @Bean
    public JavaMailSender javaMailSender() {
        JavaMailSenderImpl mailSender = new JavaMailSenderImpl();
        mailSender.setHost(host);
        mailSender.setPort(port);
        mailSender.setUsername(username);
        mailSender.setPassword(password);
        mailSender.setDefaultEncoding("UTF-8"); // 기본 인코딩 설정

        // JavaMail의 추가 속성을 설정합니다.
        Properties props = mailSender.getJavaMailProperties();
        props.put("mail.smtp.auth", auth);
        props.put("mail.smtp.starttls.enable", starttlsEnable);

        // 시간 관련 설정
        props.put("mail.smtp.connectiontimeout", connectionTimeout);
        props.put("mail.smtp.timeout", timeout);
        props.put("mail.smtp.writetimeout", writeTimeout);

        // (선택사항) SSL을 사용할 경우
        // props.put("mail.smtp.ssl.enable", "true");
        // props.put("mail.smtp.ssl.trust", host);

        return mailSender;
    }
}

