package com.rewear.email.controller;

import com.rewear.user.details.CustomUserDetails;
import com.rewear.email.service.EmailVerifiedService;
import com.rewear.common.enums.Role;
import com.rewear.organ.service.OrganService;
import com.rewear.signup.SignupForm;
import com.rewear.user.entity.User;
import com.rewear.user.service.UserServiceImpl;
import jakarta.servlet.http.HttpSession;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.validation.BindingResult;
import org.springframework.web.bind.annotation.*;
import jakarta.servlet.http.HttpServletRequest;

import java.util.EnumSet;

@Slf4j
@Controller
@RequiredArgsConstructor
public class EmailWebController {

    private final UserServiceImpl userService;
    private final EmailVerifiedService authService;
    private final OrganService organService;

    private String canon(String s) { return s == null ? null : s.trim().toLowerCase(); }

    @GetMapping({"/", "/main"})
    public String main(@AuthenticationPrincipal CustomUserDetails principal, Model model, HttpServletRequest request) {
        if (principal != null) {
            User domainUser = userService.findByUsername(principal.getUsername())
                    .orElseThrow(() -> new IllegalStateException("User not found: " + principal.getUsername()));
            model.addAttribute("user", domainUser);
            model.addAttribute("username", principal.getUsername());

            // 이미 로그인된 사용자에게는 error 메시지 표시하지 않음
            request.getSession().removeAttribute("error");
        } else {
            // 로그인되지 않은 사용자만 error 메시지 확인
            String error = (String) request.getSession().getAttribute("error");
            if (error != null) {
                model.addAttribute("error", error);
                request.getSession().removeAttribute("error");
            }
        }

        return "main";
    }

    @GetMapping("/login")
    public String loginForm(@ModelAttribute("form") LoginForm form,
                            @RequestParam(value = "registered", required = false) String registered,
                            @RequestParam(value = "error", required = false) String error,
                            Model model,
                            Authentication authentication) {
        if (authentication != null && authentication.isAuthenticated()
                && !(authentication instanceof AnonymousAuthenticationToken)) {
            return "redirect:/";
        }

        if (registered != null) {
            if ("organ".equalsIgnoreCase(registered)) {
                model.addAttribute("msg", "기관 회원가입 신청 완료! 관리자 승인 후 로그인 가능합니다.");
            } else {
                model.addAttribute("msg", "회원가입 완료! 로그인 해주세요.");
            }
        }
        if (error != null && !error.isBlank()) {
            model.addAttribute("errorCode", error);
        }
        return "login";
    }

    @GetMapping("/signup")
    public String signupForm(@ModelAttribute("form") SignupForm form,
                             BindingResult bindingResult,
                             @RequestParam(value="type", required=false) String type) {
        if ("organ".equalsIgnoreCase(type)) {
            form.setRegistrationType(SignupForm.RegistrationType.ORGAN);
        } else {
            form.setRegistrationType(SignupForm.RegistrationType.USER);
        }
        return "signup";
    }

    @PostMapping("/signup")
    public String signup(@Valid @ModelAttribute("form") SignupForm form,
                         BindingResult bindingResult,
                         HttpSession session,
                         Model model) {

        log.debug("회원가입 요청 시작 - username: {}, email: {}", form.getUsername(), form.getEmail());

        if (bindingResult.hasErrors()) {
            log.warn("검증 오류 발생 - 필드별 오류: {}", bindingResult.getFieldErrors());
            bindingResult.getAllErrors().forEach(error -> log.warn("오류: {}", error));
            return "signup";
        }

        String phoneDigits = form.getPhone()==null ? null : form.getPhone().replaceAll("\\D", "");
        // 전화번호가 비어있거나 형식이 맞지 않으면 기본값 설정
        if (phoneDigits == null || phoneDigits.isEmpty() || !phoneDigits.matches("^01[0-9]{8,9}$")) {
            phoneDigits = "01000000000"; // 기본 전화번호
        }
        form.setPhone(phoneDigits);

        String email = canon(form.getEmail());
        boolean svcVerified = authService.isEmailVerified(email);
        Object flag = session.getAttribute("EMAIL_VERIFIED:" + email);

        log.debug("이메일 인증 확인 - email: {}, svcVerified: {}, sessionFlag: {}", email, svcVerified, flag);

        if (!(svcVerified && Boolean.TRUE.equals(flag))) {
            log.warn("이메일 인증 실패 - email: {}, svcVerified: {}, sessionFlag: {}", email, svcVerified, flag);
            bindingResult.reject("noverify", "이메일 인증을 완료해야 가입할 수 있습니다.");
            return "signup";
        }

        boolean isOrgan = form.isOrgan();
        String businessNoDigits = null;
        
        // 기관 회원일 때만 사업자번호와 기관명 검증
        String orgNameTrimmed = null;
        if (isOrgan) {
            // 기관명 검증 및 정규화
            String orgName = form.getOrgName();
            if (orgName == null || orgName.trim().isBlank()) {
                bindingResult.rejectValue("orgName", "required", "기관명을 입력하세요.");
            } else {
                orgNameTrimmed = orgName.trim();
            }
            
            // 사업자번호 검증 및 정규화
            String businessNo = form.getBusinessNo();
            if (businessNo == null || businessNo.trim().isBlank()) {
                bindingResult.rejectValue("businessNo", "required", "사업자번호를 입력하세요.");
            } else {
                businessNoDigits = businessNo.replaceAll("\\D", "");
                if (businessNoDigits.length() != 10) {
                    bindingResult.rejectValue("businessNo", "invalid", "사업자번호는 숫자 10자리여야 합니다.");
                }
            }
            
            if (bindingResult.hasErrors()) return "signup";
        } else {
            // 일반 회원일 때는 businessNo와 orgName을 null로 설정하여 검증에서 제외
            form.setBusinessNo(null);
            form.setOrgName(null);
        }

        try {
            User user = new User();
            user.setUsername(form.getUsername());
            user.setPassword(form.getPassword());
            user.setName(form.getName());
            user.setEmail(email);
            user.setPhone(form.getPhone());
            user.setAddressPostcode(form.getAddressPostcode());
            user.setAddress(form.getAddress());

            if (isOrgan) {
                user.setNickname(orgNameTrimmed);
                user.setRoles(EnumSet.of(Role.ORGAN));
            } else {
                user.setNickname(form.getNickname());
                user.setRoles(EnumSet.of(Role.USER));
            }

            log.debug("사용자 등록 시작 - username: {}, email: {}, isOrgan: {}", form.getUsername(), email, isOrgan);
            User saved = userService.registerUser(user);
            log.info("사용자 등록 완료 - username: {}, userId: {}", saved.getUsername(), saved.getId());

            if (isOrgan) {
                try {
                    organService.createPending(saved, businessNoDigits, orgNameTrimmed);
                    log.info("기관 정보 생성 완료 - userId: {}, orgName: {}", saved.getId(), orgNameTrimmed);
                } catch (IllegalArgumentException | IllegalStateException e) {
                    // Organ 생성 실패 시 - User는 이미 생성되었지만 Organ 생성 실패
                    log.error("기관 정보 생성 실패 (User는 이미 생성됨) - userId: {}, orgName: {}, error: {}", 
                            saved.getId(), orgNameTrimmed, e.getMessage(), e);
                    // Organ 생성 실패 사유를 사용자에게 알림
                    if (e.getMessage().contains("사업자번호")) {
                        bindingResult.rejectValue("businessNo", "duplicate", "이미 등록된 사업자번호입니다.");
                    } else if (e.getMessage().contains("기관명")) {
                        bindingResult.rejectValue("orgName", "invalid", e.getMessage());
                    } else if (e.getMessage().contains("이미")) {
                        bindingResult.reject("organ_duplicate", "이미 기관 신청 정보가 존재합니다.");
                    } else {
                        bindingResult.reject("organ_error", e.getMessage());
                    }
                    return "signup";
                }
                session.removeAttribute("EMAIL_VERIFIED:" + email);
                log.debug("기관 회원가입 완료 - redirect to /login?registered=organ");
                return "redirect:/login?registered=organ";
            }

            session.removeAttribute("EMAIL_VERIFIED:" + email);
            log.debug("일반 회원가입 완료 - redirect to /login?registered=user");
            return "redirect:/login?registered=user";

        } catch (org.springframework.dao.DataIntegrityViolationException dup) {
            log.warn("중복 데이터 오류 - username: {}, email: {}", form.getUsername(), email, dup);
            bindingResult.reject("duplicate", "이미 사용 중인 아이디/이메일입니다.");
            return "signup";
        } catch (Exception e) {
            log.error("회원가입 처리 중 예외 발생 - username: {}, email: {}", form.getUsername(), email, e);
            bindingResult.reject("server", "회원가입 처리 중 오류가 발생했습니다.");
            return "signup";
        }
    }


    @Data
    public static class LoginForm {
        @NotBlank private String username;
        @NotBlank private String password;
    }
}