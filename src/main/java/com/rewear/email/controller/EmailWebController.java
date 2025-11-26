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

        if (bindingResult.hasErrors()) return "signup";

        String phoneDigits = form.getPhone()==null ? null : form.getPhone().replaceAll("\\D", "");
        // 전화번호가 비어있거나 형식이 맞지 않으면 기본값 설정
        if (phoneDigits == null || phoneDigits.isEmpty() || !phoneDigits.matches("^01[0-9]{8,9}$")) {
            phoneDigits = "01000000000"; // 기본 전화번호
        }
        form.setPhone(phoneDigits);

        String email = canon(form.getEmail());
        boolean svcVerified = authService.isEmailVerified(email);
        Object flag = session.getAttribute("EMAIL_VERIFIED:" + email);
        if (!(svcVerified && Boolean.TRUE.equals(flag))) {
            bindingResult.reject("noverify", "이메일 인증을 완료해야 가입할 수 있습니다.");
            return "signup";
        }

        boolean isOrgan = form.isOrgan();
        String businessNoDigits = null;
        if (isOrgan) {
            if (form.getOrgName() == null || form.getOrgName().isBlank()) {
                bindingResult.rejectValue("orgName", "required", "기관명을 입력하세요.");
            }
            businessNoDigits = (form.getBusinessNo() == null) ? "" : form.getBusinessNo().replaceAll("\\D", "");
            if (businessNoDigits.length() != 10) {
                bindingResult.rejectValue("businessNo", "invalid", "사업자번호는 숫자 10자리여야 합니다.");
            }
            if (bindingResult.hasErrors()) return "signup";
        }

        try {
            User user = new User();
            user.setUsername(form.getUsername());
            user.setPassword(form.getPassword());
            user.setName(form.getName());
            user.setEmail(email);
            user.setPhone(form.getPhone());
            user.setAddress(form.getAddress());

            if (isOrgan) {
                user.setNickname(form.getOrgName());
                user.setRoles(EnumSet.of(Role.ORGAN));
            } else {
                user.setNickname(form.getNickname());
                user.setRoles(EnumSet.of(Role.USER));
            }

            User saved = userService.registerUser(user);

            if (isOrgan) {
                organService.createPending(saved, businessNoDigits, form.getOrgName());
                session.removeAttribute("EMAIL_VERIFIED:" + email);
                return "redirect:/login?registered=organ";
            }

            session.removeAttribute("EMAIL_VERIFIED:" + email);
            return "redirect:/login?registered=user";

        } catch (org.springframework.dao.DataIntegrityViolationException dup) {
            bindingResult.reject("duplicate", "이미 사용 중인 아이디/이메일입니다.");
            return "signup";
        } catch (Exception e) {
            log.error("signup error", e);
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