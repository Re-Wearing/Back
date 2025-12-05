package com.rewear.admin.controller;

import com.rewear.admin.service.AdminOrganQueryService;
import com.rewear.admin.view.PendingOrganVM;
import com.rewear.organ.service.OrganService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@RestController
@RequestMapping("/api/admin/orgs")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminOrgApiController {

    private final AdminOrganQueryService adminOrganQueryService;
    private final OrganService organService;

    /**
     * 대기 중인 기관 목록 조회 API
     */
    @GetMapping("/pending")
    public ResponseEntity<Map<String, Object>> getPendingOrgs() {
        try {
            List<PendingOrganVM> orgs = adminOrganQueryService.findPendingVMs();
            
            List<Map<String, Object>> orgList = orgs.stream()
                    .map(this::convertToDto)
                    .collect(Collectors.toList());
            
            Map<String, Object> response = new HashMap<>();
            response.put("orgs", orgList);
            response.put("count", orgList.size());
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("대기 중인 기관 목록 조회 오류", e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", true);
            errorResponse.put("message", "기관 목록 조회 중 오류가 발생했습니다: " + e.getMessage());
            return ResponseEntity.status(500).body(errorResponse);
        }
    }

    /**
     * 기관 승인 API
     */
    @PostMapping("/{id}/approve")
    public ResponseEntity<Map<String, Object>> approveOrg(@PathVariable Long id) {
        Map<String, Object> response = new HashMap<>();
        try {
            organService.approve(id);
            response.put("success", true);
            response.put("message", "기관이 승인되었습니다.");
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            log.error("기관 승인 실패 - ID: {}", id, e);
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        } catch (Exception e) {
            log.error("기관 승인 실패 - ID: {}", id, e);
            response.put("success", false);
            response.put("message", "기관 승인 중 오류가 발생했습니다: " + e.getMessage());
            return ResponseEntity.status(500).body(response);
        }
    }

    /**
     * 기관 거부 API
     */
    @PostMapping("/{id}/reject")
    public ResponseEntity<Map<String, Object>> rejectOrg(
            @PathVariable Long id,
            @RequestBody(required = false) Map<String, String> requestBody) {
        Map<String, Object> response = new HashMap<>();
        try {
            String reason = requestBody != null ? requestBody.get("reason") : null;
            organService.reject(id, reason);
            response.put("success", true);
            response.put("message", "기관이 거부되었습니다.");
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            log.error("기관 거부 실패 - ID: {}, 사유: {}", id, requestBody != null ? requestBody.get("reason") : "없음", e);
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        } catch (Exception e) {
            log.error("기관 거부 실패 - ID: {}, 사유: {}", id, requestBody != null ? requestBody.get("reason") : "없음", e);
            response.put("success", false);
            response.put("message", "기관 거부 중 오류가 발생했습니다: " + e.getMessage());
            return ResponseEntity.status(500).body(response);
        }
    }

    /**
     * PendingOrganVM을 DTO로 변환
     */
    private Map<String, Object> convertToDto(PendingOrganVM vm) {
        Map<String, Object> dto = new HashMap<>();
        dto.put("id", vm.getId());
        dto.put("organizationName", vm.getOrgName());
        dto.put("businessNo", vm.getBusinessNo());
        dto.put("username", vm.getRequesterUsername());
        dto.put("submittedAt", vm.getRequestedAt() != null ? vm.getRequestedAt().toString() : null);
        dto.put("status", "pending");
        return dto;
    }
}

