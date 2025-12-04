package com.rewear.email.controller;

import com.rewear.email.service.EmailVerifiedService;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class EmailController {

    private final EmailVerifiedService authService;

    private String canon(String s) { return s == null ? null : s.trim().toLowerCase(); }

    @PostMapping("/send-verification")
    public ResponseEntity<?> send(@RequestBody Map<String, String> req) {
        String email = req.get("email");
        if (email == null || email.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("ok", false, "message", "이메일을 입력하세요."));
        }
        String normalizedEmail = canon(email);
        try {
            authService.sendVerificationCode(normalizedEmail);
            return ResponseEntity.ok(Map.of("ok", true, "message", "인증코드가 발송되었습니다."));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("ok", false, "message", "이메일 발송에 실패했습니다: " + e.getMessage()));
        }
    }

    @PostMapping("/verify-code")
    public ResponseEntity<?> verify(@RequestBody Map<String, String> req, HttpSession session) {
        String email = req.get("email");
        String code  = req.get("code");
        if (email == null || code == null || email.isBlank() || code.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("ok", false, "message", "이메일/코드를 입력하세요."));
        }
        String normalizedEmail = canon(email);
        boolean ok = authService.verifyCode(normalizedEmail, code);
        if (ok) {
            session.setAttribute("EMAIL_VERIFIED:" + normalizedEmail, Boolean.TRUE);
            return ResponseEntity.ok(Map.of("ok", true));
        }
        return ResponseEntity.badRequest().body(Map.of("ok", false, "message", "인증코드가 올바르지 않거나 만료되었습니다."));
    }
}
