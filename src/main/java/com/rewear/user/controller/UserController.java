package com.rewear.user.controller;

import com.rewear.user.entity.User;
import com.rewear.user.service.UserServiceImpl;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/users")
public class UserController {

    private final UserServiceImpl userService;

    /**
     * ✅ 회원가입
     * - 클라이언트에서 username, password, name, email 등을 JSON으로 전달
     */
    @PostMapping("/signup")
    public ResponseEntity<User> signup(@RequestBody User user) {
        User createdUser = userService.registerUser(user);
        return ResponseEntity.ok(createdUser);
    }

    /**
     * ✅ 로그인
     * - username / password 를 RequestParam 으로 전달
     */
    @PostMapping("/login")
    public ResponseEntity<User> login(@RequestParam String username,
                                      @RequestParam String password) {
        User loginUser = userService.login(username, password);
        return ResponseEntity.ok(loginUser);
    }

    /**
     * ✅ 전체 사용자 조회
     * - 관리자 전용으로 사용 가능 (현재는 공개)
     */
    @GetMapping
    public ResponseEntity<List<User>> getAllUsers() {
        List<User> users = userService.getAllUsers();
        return ResponseEntity.ok(users);
    }

    /**
     * ✅ 특정 사용자 조회
     */
    @GetMapping("/{id}")
    public ResponseEntity<User> getUserById(@PathVariable Long id) {
        User user = userService.getUserById(id);
        return ResponseEntity.ok(user);
    }

    /**
     * ✅ 사용자 삭제 (선택)
     * - 사용자 탈퇴 또는 관리자에 의한 삭제용
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteUser(@PathVariable Long id) {
        userService.deleteUser(id);
        return ResponseEntity.noContent().build();
    }
}