package com.rewear.user.controller;

import com.rewear.common.enums.Role;
import com.rewear.organ.service.OrganService;
import com.rewear.user.entity.User;
import com.rewear.user.repository.UserRepository;
import com.rewear.user.service.UserServiceImpl;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.authentication.InternalAuthenticationServiceException;
import org.springframework.security.authentication.LockedException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import org.springframework.web.bind.annotation.*;

import jakarta.servlet.http.HttpServletRequest;
import java.security.Principal;
import java.util.EnumSet;
import java.util.List;
import java.util.Map;

@Slf4j
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/users")
public class UserController {

    private final UserServiceImpl userService;
    private final UserRepository userRepository;
    private final OrganService organService;
    private final com.rewear.email.service.EmailVerifiedService emailVerifiedService;
    private final BCryptPasswordEncoder passwordEncoder;

    /**
     * ✅ 일반 회원가입
     * - 클라이언트에서 username, password, name, email 등을 JSON으로 전달
     */
    @PostMapping("/signup")
    public ResponseEntity<?> signup(@RequestBody User user) {
        try {
            User createdUser = userService.registerUser(user);
            return ResponseEntity.ok(createdUser);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                .body(Map.of("message", e.getMessage(), "error", "VALIDATION_ERROR"));
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                .body(Map.of("message", "회원가입 중 오류가 발생했습니다.", "error", "INTERNAL_ERROR"));
        }
    }

    /**
     * ✅ 기관 회원가입
     * - User 생성 후 Organ 엔티티도 PENDING 상태로 생성
     */
    @PostMapping("/signup/organ")
    public ResponseEntity<?> signupOrgan(@RequestBody OrganSignupRequest request) {
        try {
            // 입력 검증
            if (request.getUsername() == null || request.getUsername().trim().isEmpty()) {
                return ResponseEntity.badRequest()
                    .body(Map.of("message", "아이디를 입력해주세요.", "error", "VALIDATION_ERROR"));
            }
            if (request.getPassword() == null || request.getPassword().trim().isEmpty()) {
                return ResponseEntity.badRequest()
                    .body(Map.of("message", "비밀번호를 입력해주세요.", "error", "VALIDATION_ERROR"));
            }
            if (request.getOrgName() == null || request.getOrgName().trim().isEmpty()) {
                return ResponseEntity.badRequest()
                    .body(Map.of("message", "기관명을 입력해주세요.", "error", "VALIDATION_ERROR"));
            }
            if (request.getBusinessNumber() == null || request.getBusinessNumber().trim().isEmpty()) {
                return ResponseEntity.badRequest()
                    .body(Map.of("message", "사업자번호를 입력해주세요.", "error", "VALIDATION_ERROR"));
            }

            // User 생성
            User user = new User();
            user.setUsername(request.getUsername().trim().toLowerCase());
            user.setPassword(request.getPassword());
            user.setName(request.getManager() != null ? request.getManager().trim() : request.getOrgName().trim());
            user.setEmail(request.getEmail() != null ? request.getEmail().trim().toLowerCase() : null);
            user.setPhone(request.getPhone() != null ? request.getPhone().trim() : "01000000000");
            user.setAddressPostcode(request.getZipCode() != null ? request.getZipCode().trim() : "00000");
            user.setAddress(request.getAddress() != null ? request.getAddress().trim() : "주소 미입력");
            user.setNickname(request.getOrgName().trim()); // 기관명을 닉네임으로 설정
            user.setRoles(EnumSet.of(Role.ORGAN)); // ORGAN 권한 부여
            
            User createdUser = userService.registerUser(user);
            
            // 사업자번호에서 하이픈 제거
            String businessNoDigits = request.getBusinessNumber().replaceAll("\\D", "");
            
            // Organ 엔티티 생성 (PENDING 상태)
            organService.createPending(createdUser, businessNoDigits, request.getOrgName().trim());
            
            return ResponseEntity.ok(Map.of(
                "user", createdUser,
                "message", "기관 가입 신청이 완료되었습니다. 관리자 승인 후 로그인 가능합니다."
            ));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                .body(Map.of("message", e.getMessage(), "error", "VALIDATION_ERROR"));
        } catch (IllegalStateException e) {
            return ResponseEntity.badRequest()
                .body(Map.of("message", e.getMessage(), "error", "STATE_ERROR"));
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                .body(Map.of("message", "기관 회원가입 중 오류가 발생했습니다.", "error", "INTERNAL_ERROR"));
        }
    }

    @Data
    static class OrganSignupRequest {
        private String username;
        private String password;
        private String manager; // 담당자 이름
        private String email;
        private String phone;
        private String zipCode;
        private String address;
        private String orgName; // 기관명
        private String businessNumber; // 사업자번호
    }

    private final AuthenticationManager authenticationManager;

    /**
     * ✅ 로그인
     * - username / password 를 JSON으로 전달
     * - Spring Security 세션 인증 수행
     */
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> request,
                                    HttpServletRequest httpRequest) {
        String username = request.get("username");
        String password = request.get("password");
        
        log.info("로그인 시도: username={}", username);
        
        if (username == null || username.trim().isEmpty()) {
            log.warn("로그인 실패: 아이디가 비어있음");
            return ResponseEntity.badRequest()
                .body(Map.of("ok", false, "message", "아이디를 입력해주세요."));
        }
        if (password == null || password.trim().isEmpty()) {
            log.warn("로그인 실패: 비밀번호가 비어있음");
            return ResponseEntity.badRequest()
                .body(Map.of("ok", false, "message", "비밀번호를 입력해주세요."));
        }
        
        try {
            log.debug("인증 시도 시작: username={}", username.trim().toLowerCase());
            // Spring Security 인증 수행
            UsernamePasswordAuthenticationToken authToken = 
                new UsernamePasswordAuthenticationToken(username.trim().toLowerCase(), password);
            
            Authentication authentication = authenticationManager.authenticate(authToken);
            log.info("인증 성공: username={}", username.trim().toLowerCase());
            
            // SecurityContext 생성 및 세션에 저장
            SecurityContext securityContext = SecurityContextHolder.createEmptyContext();
            securityContext.setAuthentication(authentication);
            SecurityContextHolder.setContext(securityContext);
            
            httpRequest.getSession().setAttribute(
                HttpSessionSecurityContextRepository.SPRING_SECURITY_CONTEXT_KEY,
                securityContext
            );
            
            // 사용자 정보 조회
            User user = userService.findByUsername(username.trim().toLowerCase())
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));
            
            // 기관 회원인 경우 승인 상태 확인
            if (user.getRoles() != null && user.getRoles().contains(Role.ORGAN)) {
                var organOpt = organService.findByUserId(user.getId());
                if (organOpt.isPresent()) {
                    var organ = organOpt.get();
                    if (organ.getStatus() == com.rewear.common.enums.OrganStatus.PENDING) {
                        log.warn("기관 계정 로그인 차단: username={}, status=PENDING", username);
                        return ResponseEntity.ok(Map.of(
                            "ok", false,
                            "message", "기관 계정은 관리자 승인 후 로그인할 수 있습니다.",
                            "reason", "orgPending"
                        ));
                    }
                }
            }
            
            // 비밀번호 제거 후 반환
            user.setPassword(null);
            
            log.info("로그인 성공: username={}, role={}", username, 
                user.getRoles() != null && !user.getRoles().isEmpty() 
                    ? user.getRoles().iterator().next().name() 
                    : "USER");
            
            return ResponseEntity.ok(Map.of(
                "ok", true,
                "user", user,
                "role", user.getRoles() != null && !user.getRoles().isEmpty() 
                    ? user.getRoles().iterator().next().name() 
                    : "USER"
            ));
        } catch (BadCredentialsException e) {
            log.warn("로그인 실패: 잘못된 자격증명 - username={}", username);
            return ResponseEntity.status(401)
                .body(Map.of("ok", false, "message", "아이디 또는 비밀번호가 올바르지 않습니다.", "errorType", "BAD_CREDENTIALS"));
        } catch (LockedException e) {
            log.warn("로그인 실패: 계정 정지 - username={}, message={}", username, e.getMessage());
            return ResponseEntity.status(403)
                .body(Map.of("ok", false, "message", e.getMessage(), "errorType", "ACCOUNT_LOCKED"));
        } catch (DisabledException e) {
            log.warn("로그인 실패: 계정 비활성화 - username={}, message={}", username, e.getMessage());
            // 기관 승인 대기/거부인 경우
            return ResponseEntity.status(403)
                .body(Map.of("ok", false, "message", e.getMessage(), "errorType", "ORG_PENDING", "reason", "orgPending"));
        } catch (org.springframework.security.authentication.InternalAuthenticationServiceException e) {
            // InternalAuthenticationServiceException으로 감싸진 예외 처리
            Throwable cause = e.getCause();
            if (cause instanceof DisabledException) {
                log.warn("로그인 실패: 계정 비활성화 (Internal) - username={}, message={}", username, cause.getMessage());
                return ResponseEntity.status(403)
                    .body(Map.of("ok", false, "message", cause.getMessage(), "errorType", "ORG_PENDING", "reason", "orgPending"));
            } else if (cause instanceof LockedException) {
                log.warn("로그인 실패: 계정 정지 (Internal) - username={}, message={}", username, cause.getMessage());
                return ResponseEntity.status(403)
                    .body(Map.of("ok", false, "message", cause.getMessage(), "errorType", "ACCOUNT_LOCKED"));
            } else if (cause instanceof BadCredentialsException) {
                log.warn("로그인 실패: 잘못된 자격증명 (Internal) - username={}", username);
                return ResponseEntity.status(401)
                    .body(Map.of("ok", false, "message", "아이디 또는 비밀번호가 올바르지 않습니다.", "errorType", "BAD_CREDENTIALS"));
            } else {
                log.error("로그인 중 예외 발생 (Internal): username={}, cause={}", username, cause != null ? cause.getClass().getSimpleName() : "null", e);
                return ResponseEntity.status(500)
                    .body(Map.of("ok", false, "message", "로그인 중 오류가 발생했습니다.", "errorType", "INTERNAL_ERROR"));
            }
        } catch (IllegalArgumentException e) {
            log.warn("로그인 실패: 사용자 없음 - username={}, message={}", username, e.getMessage());
            return ResponseEntity.status(401)
                .body(Map.of("ok", false, "message", e.getMessage(), "errorType", "USER_NOT_FOUND"));
        } catch (Exception e) {
            log.error("로그인 중 예외 발생: username={}", username, e);
            return ResponseEntity.status(500)
                .body(Map.of("ok", false, "message", "로그인 중 오류가 발생했습니다.", "errorType", "INTERNAL_ERROR"));
        }
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

    /**
     * ✅ 아이디 찾기 - 인증 코드 발송
     * - 이름과 이메일로 사용자 확인 후 인증 코드 발송
     */
    @PostMapping("/find-id")
    public ResponseEntity<?> findId(@RequestBody Map<String, String> request) {
        String name = request.get("name");
        String email = request.get("email");
        
        if (name == null || name.trim().isEmpty()) {
            return ResponseEntity.badRequest()
                .body(Map.of("ok", false, "message", "이름을 입력해주세요."));
        }
        if (email == null || email.trim().isEmpty()) {
            return ResponseEntity.badRequest()
                .body(Map.of("ok", false, "message", "이메일을 입력해주세요."));
        }
        
        try {
            var userOpt = userService.findByNameAndEmail(name.trim(), email.trim().toLowerCase());
            if (userOpt.isEmpty()) {
                return ResponseEntity.badRequest()
                    .body(Map.of("ok", false, "message", "일치하는 정보를 찾을 수 없습니다."));
            }
            
            // 이메일 인증 코드 발송
            this.emailVerifiedService.sendVerificationCode(email.trim().toLowerCase());
            
            return ResponseEntity.ok(Map.of(
                "ok", true,
                "message", "인증코드가 발송되었습니다."
            ));
        } catch (Exception e) {
            log.error("아이디 찾기 중 오류 발생: name={}, email={}", name, email, e);
            return ResponseEntity.status(500)
                .body(Map.of("ok", false, "message", "아이디 찾기 중 오류가 발생했습니다."));
        }
    }

    /**
     * ✅ 아이디 찾기 - 인증 후 아이디 반환
     * - 이메일 인증 코드 확인 후 아이디 반환
     */
    @PostMapping("/find-id/verify")
    public ResponseEntity<?> findIdVerify(@RequestBody Map<String, String> request) {
        String name = request.get("name");
        String email = request.get("email");
        String code = request.get("code");
        
        if (name == null || name.trim().isEmpty()) {
            return ResponseEntity.badRequest()
                .body(Map.of("ok", false, "message", "이름을 입력해주세요."));
        }
        if (email == null || email.trim().isEmpty()) {
            return ResponseEntity.badRequest()
                .body(Map.of("ok", false, "message", "이메일을 입력해주세요."));
        }
        if (code == null || code.trim().isEmpty()) {
            return ResponseEntity.badRequest()
                .body(Map.of("ok", false, "message", "인증코드를 입력해주세요."));
        }
        
        try {
            // 사용자 확인
            var userOpt = userService.findByNameAndEmail(name.trim(), email.trim().toLowerCase());
            if (userOpt.isEmpty()) {
                return ResponseEntity.badRequest()
                    .body(Map.of("ok", false, "message", "일치하는 정보를 찾을 수 없습니다."));
            }
            
            // 이메일 인증 코드 확인
            boolean verified = this.emailVerifiedService.verifyCode(email.trim().toLowerCase(), code.trim());
            if (!verified) {
                return ResponseEntity.badRequest()
                    .body(Map.of("ok", false, "message", "인증코드가 올바르지 않거나 만료되었습니다."));
            }
            
            User user = userOpt.get();
            return ResponseEntity.ok(Map.of(
                "ok", true,
                "username", user.getUsername(),
                "message", "아이디를 찾았습니다."
            ));
        } catch (Exception e) {
            log.error("아이디 찾기 인증 중 오류 발생: name={}, email={}", name, email, e);
            return ResponseEntity.status(500)
                .body(Map.of("ok", false, "message", "아이디 찾기 중 오류가 발생했습니다."));
        }
    }

    /**
     * ✅ 비밀번호 찾기 - 인증 코드 발송
     * - 아이디와 이메일로 사용자 확인 후 인증 코드 발송
     */
    @PostMapping("/find-password")
    public ResponseEntity<?> findPassword(@RequestBody Map<String, String> request) {
        String username = request.get("username");
        String email = request.get("email");
        
        if (username == null || username.trim().isEmpty()) {
            return ResponseEntity.badRequest()
                .body(Map.of("ok", false, "message", "아이디를 입력해주세요."));
        }
        if (email == null || email.trim().isEmpty()) {
            return ResponseEntity.badRequest()
                .body(Map.of("ok", false, "message", "이메일을 입력해주세요."));
        }
        
        try {
            var userOpt = userService.findByUsernameAndEmail(username.trim().toLowerCase(), email.trim().toLowerCase());
            if (userOpt.isEmpty()) {
                return ResponseEntity.badRequest()
                    .body(Map.of("ok", false, "message", "일치하는 정보를 찾을 수 없습니다."));
            }
            
            // 이메일 인증 코드 발송
            this.emailVerifiedService.sendVerificationCode(email.trim().toLowerCase());
            
            return ResponseEntity.ok(Map.of(
                "ok", true,
                "message", "인증코드가 발송되었습니다."
            ));
        } catch (Exception e) {
            log.error("비밀번호 찾기 중 오류 발생: username={}, email={}", username, email, e);
            return ResponseEntity.status(500)
                .body(Map.of("ok", false, "message", "비밀번호 찾기 중 오류가 발생했습니다."));
        }
    }

    /**
     * ✅ 비밀번호 재설정
     * - 이메일 인증 후 새 비밀번호로 변경
     */
    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@RequestBody Map<String, String> request) {
        String username = request.get("username");
        String email = request.get("email");
        String code = request.get("code");
        String newPassword = request.get("newPassword");
        
        if (username == null || username.trim().isEmpty()) {
            return ResponseEntity.badRequest()
                .body(Map.of("ok", false, "message", "아이디를 입력해주세요."));
        }
        if (email == null || email.trim().isEmpty()) {
            return ResponseEntity.badRequest()
                .body(Map.of("ok", false, "message", "이메일을 입력해주세요."));
        }
        if (code == null || code.trim().isEmpty()) {
            return ResponseEntity.badRequest()
                .body(Map.of("ok", false, "message", "인증코드를 입력해주세요."));
        }
        if (newPassword == null || newPassword.trim().isEmpty()) {
            return ResponseEntity.badRequest()
                .body(Map.of("ok", false, "message", "새 비밀번호를 입력해주세요."));
        }
        
        try {
            // 사용자 확인
            var userOpt = userService.findByUsernameAndEmail(username.trim().toLowerCase(), email.trim().toLowerCase());
            if (userOpt.isEmpty()) {
                return ResponseEntity.badRequest()
                    .body(Map.of("ok", false, "message", "일치하는 정보를 찾을 수 없습니다."));
            }
            
            // 이메일 인증 코드 확인
            boolean verified = this.emailVerifiedService.verifyCode(email.trim().toLowerCase(), code.trim());
            if (!verified) {
                return ResponseEntity.badRequest()
                    .body(Map.of("ok", false, "message", "인증코드가 올바르지 않거나 만료되었습니다."));
            }
            
            // 비밀번호 재설정
            userService.resetPassword(username.trim().toLowerCase(), newPassword.trim());
            
            return ResponseEntity.ok(Map.of(
                "ok", true,
                "message", "비밀번호가 성공적으로 변경되었습니다."
            ));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                .body(Map.of("ok", false, "message", e.getMessage()));
        } catch (Exception e) {
            log.error("비밀번호 재설정 중 오류 발생: username={}", username, e);
            return ResponseEntity.status(500)
                .body(Map.of("ok", false, "message", "비밀번호 재설정 중 오류가 발생했습니다."));
        }
    }

    /**
     * ✅ 현재 로그인한 사용자 정보 조회
     */
    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUser(Principal principal) {
        try {
            if (principal == null) {
                return ResponseEntity.status(401)
                    .body(Map.of("ok", false, "message", "로그인이 필요합니다."));
            }
            
            String username = principal.getName();
            User user = userService.findByUsername(username)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));
            
            // 역할 정보 가져오기
            String role = "일반 회원";
            if (user.getRoles() != null) {
                if (user.getRoles().contains(Role.ADMIN)) {
                    role = "관리자 회원";
                } else if (user.getRoles().contains(Role.ORGAN)) {
                    role = "기관 회원";
                }
            }
            
            return ResponseEntity.ok(Map.of(
                "ok", true,
                "user", Map.of(
                    "id", user.getId(),
                    "username", user.getUsername(),
                    "name", user.getName(),
                    "nickname", user.getNickname() != null ? user.getNickname() : user.getUsername(),
                    "email", user.getEmail(),
                    "phone", user.getPhone() != null ? user.getPhone() : "",
                    "address", user.getAddress() != null ? user.getAddress() : "",
                    "role", role
                )
            ));
        } catch (Exception e) {
            log.error("사용자 정보 조회 중 오류 발생: username={}", principal != null ? principal.getName() : "unknown", e);
            return ResponseEntity.status(500)
                .body(Map.of("ok", false, "message", "사용자 정보 조회 중 오류가 발생했습니다."));
        }
    }

    /**
     * ✅ 프로필 정보 수정
     */
    @PutMapping("/me/profile")
    public ResponseEntity<?> updateProfile(
            @RequestBody Map<String, Object> updates,
            Principal principal) {
        try {
            if (principal == null) {
                return ResponseEntity.status(401)
                    .body(Map.of("ok", false, "message", "로그인이 필요합니다."));
            }
            
            String username = principal.getName();
            User user = userService.findByUsername(username)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));
            
            // 업데이트할 필드 확인
            if (updates.containsKey("nickname")) {
                String nickname = (String) updates.get("nickname");
                if (nickname != null && !nickname.trim().isEmpty()) {
                    // 닉네임 중복 체크 (현재 사용자의 닉네임이 아닌 경우에만)
                    if (!nickname.equals(user.getNickname()) && userService.isNicknameDup(nickname)) {
                        return ResponseEntity.badRequest()
                            .body(Map.of("ok", false, "message", "이미 사용 중인 닉네임입니다."));
                    }
                    user.setNickname(nickname.trim());
                }
            }
            
            // 이메일은 별도 API로 변경 (인증 필요)
            // 프로필 업데이트에서는 이메일 변경 불가
            
            if (updates.containsKey("phone")) {
                String phone = (String) updates.get("phone");
                if (phone != null && !phone.trim().isEmpty()) {
                    // 하이픈 제거 (프론트엔드에서 포맷팅된 번호가 올 수 있음)
                    String cleanedPhone = phone.trim().replaceAll("-", "");
                    user.setPhone(cleanedPhone);
                }
            }
            
            if (updates.containsKey("address")) {
                String address = (String) updates.get("address");
                user.setAddress(address != null ? address.trim() : "");
            }
            
            userRepository.save(user);
            
            return ResponseEntity.ok(Map.of(
                "ok", true,
                "message", "프로필이 저장되었습니다."
            ));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                .body(Map.of("ok", false, "message", e.getMessage()));
        } catch (Exception e) {
            log.error("프로필 수정 중 오류 발생: username={}", principal != null ? principal.getName() : "unknown", e);
            return ResponseEntity.status(500)
                .body(Map.of("ok", false, "message", "프로필 수정 중 오류가 발생했습니다."));
        }
    }

    /**
     * ✅ 비밀번호 변경
     */
    @PutMapping("/me/password")
    public ResponseEntity<?> changePassword(
            @RequestBody Map<String, String> passwordData,
            Principal principal) {
        try {
            if (principal == null) {
                return ResponseEntity.status(401)
                    .body(Map.of("ok", false, "message", "로그인이 필요합니다."));
            }
            
            String username = principal.getName();
            String currentPassword = passwordData.get("currentPassword");
            String newPassword = passwordData.get("newPassword");
            
            if (currentPassword == null || currentPassword.trim().isEmpty()) {
                return ResponseEntity.badRequest()
                    .body(Map.of("ok", false, "message", "현재 비밀번호를 입력해주세요."));
            }
            
            if (newPassword == null || newPassword.trim().isEmpty()) {
                return ResponseEntity.badRequest()
                    .body(Map.of("ok", false, "message", "새 비밀번호를 입력해주세요."));
            }
            
            if (newPassword.length() < 5) {
                return ResponseEntity.badRequest()
                    .body(Map.of("ok", false, "message", "비밀번호는 최소 5자 이상이어야 합니다."));
            }
            
            User user = userService.findByUsername(username)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));
            
            // 현재 비밀번호 확인
            if (!passwordEncoder.matches(currentPassword.trim(), user.getPassword())) {
                return ResponseEntity.badRequest()
                    .body(Map.of("ok", false, "message", "현재 비밀번호가 올바르지 않습니다."));
            }
            
            // 기존 비밀번호와 동일한지 확인
            if (passwordEncoder.matches(newPassword.trim(), user.getPassword())) {
                return ResponseEntity.badRequest()
                    .body(Map.of("ok", false, "message", "기존과 동일한 비밀번호는 사용할 수 없습니다."));
            }
            
            // 비밀번호 변경
            user.setPassword(passwordEncoder.encode(newPassword.trim()));
            userRepository.save(user);
            
            return ResponseEntity.ok(Map.of(
                "ok", true,
                "message", "비밀번호가 변경되었습니다."
            ));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                .body(Map.of("ok", false, "message", e.getMessage()));
        } catch (Exception e) {
            log.error("비밀번호 변경 중 오류 발생: username={}", principal != null ? principal.getName() : "unknown", e);
            return ResponseEntity.status(500)
                .body(Map.of("ok", false, "message", "비밀번호 변경 중 오류가 발생했습니다."));
        }
    }

    /**
     * ✅ 회원 탈퇴
     */
    @DeleteMapping("/me")
    public ResponseEntity<?> withdraw(Principal principal) {
        try {
            if (principal == null) {
                return ResponseEntity.status(401)
                    .body(Map.of("ok", false, "message", "로그인이 필요합니다."));
            }
            
            String username = principal.getName();
            User user = userService.findByUsername(username)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));
            
            // 관리자는 웹에서 탈퇴할 수 없음
            if (user.getRoles() != null && user.getRoles().contains(Role.ADMIN)) {
                return ResponseEntity.badRequest()
                    .body(Map.of("ok", false, "message", "관리자는 웹에서 탈퇴할 수 없습니다."));
            }
            
            // 회원 탈퇴 (실제로는 삭제하지 않고 상태를 변경할 수도 있음)
            userService.deleteUser(user.getId());
            
            return ResponseEntity.ok(Map.of(
                "ok", true,
                "message", "회원 탈퇴가 완료되었습니다."
            ));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                .body(Map.of("ok", false, "message", e.getMessage()));
        } catch (Exception e) {
            log.error("회원 탈퇴 중 오류 발생: username={}", principal != null ? principal.getName() : "unknown", e);
            return ResponseEntity.status(500)
                .body(Map.of("ok", false, "message", "회원 탈퇴 중 오류가 발생했습니다."));
        }
    }

    /**
     * ✅ 이메일 변경 인증코드 전송
     */
    @PostMapping("/me/email/send-verification")
    public ResponseEntity<?> sendEmailChangeVerification(
            @RequestBody Map<String, String> request,
            Principal principal) {
        try {
            if (principal == null) {
                return ResponseEntity.status(401)
                    .body(Map.of("ok", false, "message", "로그인이 필요합니다."));
            }
            
            String newEmail = request.get("email");
            if (newEmail == null || newEmail.trim().isEmpty()) {
                return ResponseEntity.badRequest()
                    .body(Map.of("ok", false, "message", "이메일을 입력해주세요."));
            }
            
            String normalizedEmail = newEmail.trim().toLowerCase();
            
            // 현재 사용자 확인
            String username = principal.getName();
            User user = userService.findByUsername(username)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));
            
            // 현재 이메일과 동일한지 확인
            if (normalizedEmail.equals(user.getEmail())) {
                return ResponseEntity.badRequest()
                    .body(Map.of("ok", false, "message", "현재 이메일과 동일합니다."));
            }
            
            // 이메일 중복 체크
            if (userService.isEmailDup(normalizedEmail)) {
                return ResponseEntity.badRequest()
                    .body(Map.of("ok", false, "message", "이미 사용 중인 이메일입니다."));
            }
            
            // 새 이메일로 인증코드 전송
            emailVerifiedService.sendVerificationCode(normalizedEmail);
            
            return ResponseEntity.ok(Map.of(
                "ok", true,
                "message", "인증코드가 발송되었습니다."
            ));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                .body(Map.of("ok", false, "message", e.getMessage()));
        } catch (Exception e) {
            log.error("이메일 변경 인증코드 전송 중 오류 발생: username={}", principal != null ? principal.getName() : "unknown", e);
            return ResponseEntity.status(500)
                .body(Map.of("ok", false, "message", "인증코드 전송 중 오류가 발생했습니다."));
        }
    }

    /**
     * ✅ 이메일 변경 (인증코드 확인 후)
     */
    @PutMapping("/me/email")
    public ResponseEntity<?> changeEmail(
            @RequestBody Map<String, String> request,
            Principal principal) {
        try {
            if (principal == null) {
                return ResponseEntity.status(401)
                    .body(Map.of("ok", false, "message", "로그인이 필요합니다."));
            }
            
            String newEmail = request.get("email");
            String code = request.get("code");
            
            if (newEmail == null || newEmail.trim().isEmpty()) {
                return ResponseEntity.badRequest()
                    .body(Map.of("ok", false, "message", "이메일을 입력해주세요."));
            }
            
            if (code == null || code.trim().isEmpty()) {
                return ResponseEntity.badRequest()
                    .body(Map.of("ok", false, "message", "인증코드를 입력해주세요."));
            }
            
            String normalizedEmail = newEmail.trim().toLowerCase();
            
            // 현재 사용자 확인
            String username = principal.getName();
            User user = userService.findByUsername(username)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));
            
            // 현재 이메일과 동일한지 확인
            if (normalizedEmail.equals(user.getEmail())) {
                return ResponseEntity.badRequest()
                    .body(Map.of("ok", false, "message", "현재 이메일과 동일합니다."));
            }
            
            // 이메일 중복 체크
            if (userService.isEmailDup(normalizedEmail)) {
                return ResponseEntity.badRequest()
                    .body(Map.of("ok", false, "message", "이미 사용 중인 이메일입니다."));
            }
            
            // 인증코드 확인
            boolean verified = emailVerifiedService.verifyCode(normalizedEmail, code.trim());
            if (!verified) {
                return ResponseEntity.badRequest()
                    .body(Map.of("ok", false, "message", "인증코드가 올바르지 않거나 만료되었습니다."));
            }
            
            // 이메일 변경
            user.setEmail(normalizedEmail);
            userRepository.save(user);
            
            return ResponseEntity.ok(Map.of(
                "ok", true,
                "message", "이메일이 성공적으로 변경되었습니다."
            ));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                .body(Map.of("ok", false, "message", e.getMessage()));
        } catch (Exception e) {
            log.error("이메일 변경 중 오류 발생: username={}", principal != null ? principal.getName() : "unknown", e);
            return ResponseEntity.status(500)
                .body(Map.of("ok", false, "message", "이메일 변경 중 오류가 발생했습니다."));
        }
    }
}