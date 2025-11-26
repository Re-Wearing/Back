package com.rewear.admin.controller;

import com.rewear.admin.service.AdminOrganQueryService;
import com.rewear.admin.view.PendingOrganVM;
import com.rewear.common.enums.OrganStatus;
import com.rewear.organ.service.OrganService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

import java.util.List;

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
    public String pendingList(Model model) {
        List<PendingOrganVM> orgs = adminOrganQueryService.findPendingVMs();
        model.addAttribute("status", OrganStatus.PENDING);
        model.addAttribute("orgs", orgs); // templates/admin/orgs_pending.html 에서 DTO 필드만 사용
        return "admin/orgs_pending";
    }

    // 승인
    @PostMapping("/{id}/approve")
    public String approve(@PathVariable Long id, RedirectAttributes ra) {
        organService.approve(id);
        ra.addFlashAttribute("msg", "승인 완료");
        return "redirect:/admin/orgs/pending";
    }

    // 반려 (사유 optional)
    @PostMapping("/{id}/reject")
    public String reject(@PathVariable Long id,
                         @RequestParam(name = "reason", required = false) String reason,
                         RedirectAttributes ra) {
        organService.reject(id, reason);
        ra.addFlashAttribute("msg", "반려 처리 완료");
        return "redirect:/admin/orgs/pending";
    }
}
