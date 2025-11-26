package com.rewear.admin.controller;

import com.rewear.admin.service.AdminServiceImpl;
import com.rewear.admin.entity.Admin;
import com.rewear.common.utils.ApiResponse;
import com.rewear.user.entity.User;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 관리자 로그인 전용 컨트롤러
 */
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/admin")
public class AdminController {

    private final AdminServiceImpl adminService;

    /**
     * ✅ 관리자 로그인
     * - username / password 를 입력받아 검증
     * - 기본 계정은 AdminConfig에서 자동 생성됨 (ex. admin / 1234)
     */
    @PostMapping("/login")
    public ResponseEntity<Admin> login(@RequestParam String username,
                                       @RequestParam String password) {
        Admin admin = adminService.login(username, password);
        return ResponseEntity.ok(admin);
    }

    @GetMapping("/users")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<User>>> getAllUsers() {
        List<User> users = adminService.getAllUsers();
        return ResponseEntity.ok(ApiResponse.ok(users));
    }
}
