package com.rewear.admin.controller;

import com.rewear.admin.service.AdminOrganQueryService;
import com.rewear.admin.view.PendingOrganVM;
import com.rewear.common.enums.OrganStatus;
import com.rewear.organ.service.OrganService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

import java.util.List;

@Slf4j
@Controller
@RequiredArgsConstructor
@RequestMapping("/admin/orgs")
@PreAuthorize("hasRole('ADMIN')")
public class AdminOrgController {

    // ✅ 목록은 DTO(View Model)로 조회
    private final AdminOrganQueryService adminOrganQueryService;

    // ✅ 승인/반려는 기존 도메인 서비스 사용
    private final OrganService organService;

    // 승인 대기 목록 (DTO만 템플릿으로 전달)
    @GetMapping("/pending")
    public String pendingList(Model model, Authentication authentication) {
        try {
            log.debug("기관 승인 페이지 접근 - 사용자: {}, 권한: {}", 
                    authentication != null ? authentication.getName() : "null",
                    authentication != null ? authentication.getAuthorities() : "null");
            List<PendingOrganVM> orgs = adminOrganQueryService.findPendingVMs();
            log.debug("승인 대기 기관 목록 조회 완료 - 개수: {}", orgs.size());
            model.addAttribute("status", OrganStatus.PENDING);
            model.addAttribute("orgs", orgs); // templates/admin/orgs_pending.html 에서 DTO 필드만 사용
            return "admin/orgs_pending";
        } catch (Exception e) {
            log.error("기관 승인 페이지 조회 실패", e);
            model.addAttribute("error", "기관 승인 목록을 불러오는 중 오류가 발생했습니다: " + e.getMessage());
            model.addAttribute("orgs", List.<PendingOrganVM>of()); // 빈 리스트 반환
            return "admin/orgs_pending";
        }
    }

    // 승인
    @PostMapping("/{id}/approve")
    public String approve(@PathVariable Long id, RedirectAttributes ra) {
        try {
            log.debug("기관 승인 요청 - ID: {}", id);
            organService.approve(id);
            log.info("기관 승인 완료 - ID: {}", id);
            ra.addFlashAttribute("msg", "승인 완료");
            return "redirect:/admin/orgs/pending";
        } catch (Exception e) {
            log.error("기관 승인 실패 - ID: {}", id, e);
            ra.addFlashAttribute("error", "승인 처리 중 오류가 발생했습니다: " + e.getMessage());
            return "redirect:/admin/orgs/pending";
        }
    }

    // 반려 (사유 optional)
    @PostMapping("/{id}/reject")
    public String reject(@PathVariable Long id,
                         @RequestParam(name = "reason", required = false) String reason,
                         RedirectAttributes ra) {
        try {
            log.debug("기관 반려 요청 - ID: {}, 사유: {}", id, reason != null ? reason : "없음");
            organService.reject(id, reason);
            log.info("기관 반려 완료 - ID: {}, 사유: {}", id, reason != null ? reason : "없음");
            ra.addFlashAttribute("msg", "반려 처리 완료");
            return "redirect:/admin/orgs/pending";
        } catch (Exception e) {
            log.error("기관 반려 실패 - ID: {}, 사유: {}", id, reason != null ? reason : "없음", e);
            ra.addFlashAttribute("error", "반려 처리 중 오류가 발생했습니다: " + e.getMessage());
            return "redirect:/admin/orgs/pending";
        }
    }
}
