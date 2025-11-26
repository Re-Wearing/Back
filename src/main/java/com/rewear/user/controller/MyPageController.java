package com.rewear.user.controller;

import com.rewear.user.entity.MyPageInfo;
import com.rewear.user.service.MyPageService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;

import java.security.Principal;

@Slf4j
@Controller
@RequestMapping("/mypage")
@RequiredArgsConstructor
public class MyPageController {

    private final MyPageService mypageService;

    /**
     * 마이페이지 화면
     */
    @GetMapping
    public String myPage(@RequestParam(required = false) Boolean success,
                        Model model, Principal principal) {
        String userId = principal.getName();
        model.addAttribute("info", mypageService.getMyPageInfo(userId));
        if (success != null && success) {
            model.addAttribute("success", true);
        }
        return "mypage/mypage";
    }

    /**
     * 비밀번호 확인 화면
     */
    @GetMapping("/verify")
    public String verifyForm(@RequestParam(required = false, defaultValue = "/mypage") String redirect, Model model) {
        log.info("verifyForm called with redirect: {}", redirect);
        String redirectValue = (redirect != null && !redirect.isEmpty()) ? redirect : "/mypage";
        model.addAttribute("redirect", redirectValue);
        log.info("Returning view: mypage/verify with redirect: {}", redirectValue);
        return "mypage/verify";
    }

    /**
     * 비밀번호 검증 처리
     */
    @PostMapping("/verify")
    public String verify(@RequestParam String password,
                         @RequestParam(required = false, defaultValue = "/mypage") String redirect,
                         Principal principal,
                         Model model) {

        if (!mypageService.checkPassword(principal.getName(), password)) {
            model.addAttribute("redirect", redirect);
            model.addAttribute("errorMsg", "비밀번호가 일치하지 않습니다.");
            return "mypage/verify";
        }

        return "redirect:" + redirect;
    }

    /**
     * 전체 정보 수정 페이지
     */
    @GetMapping("/edit/all")
    public String editAll(Model model, Principal principal) {
        String userId = principal.getName();
        MyPageInfo info = mypageService.getMyPageInfo(userId);
        model.addAttribute("info", info);
        return "mypage/editAll";
    }

    /**
     * 전체 정보 수정 처리
     */
    @PostMapping("/edit/all")
    public String updateAll(@ModelAttribute MyPageInfo updatedInfo,
                            Principal principal,
                            Model model) {
        try {
            mypageService.updateAll(principal.getName(), updatedInfo);
            model.addAttribute("successMsg", "정보가 성공적으로 수정되었습니다.");
            return "redirect:/mypage?success=true";
        } catch (IllegalArgumentException e) {
            model.addAttribute("errorMsg", e.getMessage());
            model.addAttribute("info", updatedInfo);
            return "mypage/editAll";
        }
    }

    /**
     * 비밀번호 변경 페이지
     */
    @GetMapping("/edit/password")
    public String editPasswordForm() {
        return "mypage/editPassword";
    }

    /**
     * 비밀번호 변경 처리
     */
    @PostMapping("/edit/password")
    public String updatePassword(@RequestParam String currentPassword,
                                 @RequestParam String newPassword,
                                 @RequestParam String confirmPassword,
                                 Principal principal,
                                 Model model) {
        try {
            // 새 비밀번호 확인 일치 검증
            if (!newPassword.equals(confirmPassword)) {
                model.addAttribute("errorMsg", "새 비밀번호와 확인 비밀번호가 일치하지 않습니다.");
                return "mypage/editPassword";
            }
            
            mypageService.updatePassword(principal.getName(), currentPassword, newPassword);
            model.addAttribute("successMsg", "비밀번호가 성공적으로 변경되었습니다.");
            return "redirect:/mypage?success=true";
        } catch (IllegalArgumentException e) {
            model.addAttribute("errorMsg", e.getMessage());
            return "mypage/editPassword";
        }
    }
}
