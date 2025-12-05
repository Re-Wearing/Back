package com.rewear.admin.controller;

import com.rewear.admin.service.AdminServiceImpl;
import com.rewear.admin.entity.Admin;
import com.rewear.common.utils.ApiResponse;
import com.rewear.user.entity.User;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

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

    /**
     * 사용자 삭제 API
     */
    @DeleteMapping("/users/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> deleteUser(@PathVariable Long id) {
        Map<String, Object> response = new HashMap<>();
        try {
            adminService.deleteUserById(id);
            response.put("success", true);
            response.put("message", "사용자가 삭제되었습니다.");
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "사용자 삭제 중 오류가 발생했습니다: " + e.getMessage());
            return ResponseEntity.status(500).body(response);
        }
    }

    /**
     * 비밀번호 초기화 API
     */
    @PutMapping("/users/{id}/reset-password")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> resetPassword(@PathVariable Long id) {
        Map<String, Object> response = new HashMap<>();
        try {
            adminService.resetUserPassword(id);
            response.put("success", true);
            response.put("message", "비밀번호가 초기화되었습니다. (기본 비밀번호: rewear123!)");
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "비밀번호 초기화 중 오류가 발생했습니다: " + e.getMessage());
            return ResponseEntity.status(500).body(response);
        }
    }
}
