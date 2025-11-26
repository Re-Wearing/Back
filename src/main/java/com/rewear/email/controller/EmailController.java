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

    @PostMapping("/send-verification")
    public ResponseEntity<?> send(@RequestBody Map<String, String> req) {
        String email = req.get("email");
        if (email == null || email.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("ok", false, "message", "이메일을 입력하세요."));
        }
        authService.sendVerificationCode(email);
        return ResponseEntity.ok(Map.of("ok", true));
    }

    @PostMapping("/verify-code")
    public ResponseEntity<?> verify(@RequestBody Map<String, String> req, HttpSession session) {
        String email = req.get("email");
        String code  = req.get("code");
        if (email == null || code == null || email.isBlank() || code.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("ok", false, "message", "이메일/코드를 입력하세요."));
        }
        boolean ok = authService.verifyCode(email, code);
        if (ok) {
            session.setAttribute("EMAIL_VERIFIED:" + email, Boolean.TRUE);
            return ResponseEntity.ok(Map.of("ok", true));
        }
        return ResponseEntity.badRequest().body(Map.of("ok", false, "message", "인증코드가 올바르지 않거나 만료되었습니다."));
    }
}
