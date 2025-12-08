package com.rewear.organ.controller;

import com.rewear.common.enums.OrganStatus;
import com.rewear.organ.entity.Organ;
import com.rewear.organ.service.OrganService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@RestController
@RequestMapping("/api/organs")
@RequiredArgsConstructor
public class OrganApiController {

    private final OrganService organService;

    /**
     * 승인된 기관 목록 조회 API
     */
    @GetMapping
    public ResponseEntity<Map<String, Object>> getApprovedOrgans() {
        try {
            List<Organ> organs = organService.findByStatus(OrganStatus.APPROVED);
            
            List<Map<String, Object>> organList = organs.stream()
                    .map(organ -> {
                        Map<String, Object> organDto = new HashMap<>();
                        organDto.put("id", organ.getId());
                        organDto.put("name", organ.getOrgName());
                        organDto.put("orgName", organ.getOrgName());
                        organDto.put("username", organ.getUser() != null ? organ.getUser().getUsername() : null);
                        organDto.put("businessNo", organ.getBusinessNo());
                        return organDto;
                    })
                    .collect(Collectors.toList());
            
            Map<String, Object> response = new HashMap<>();
            response.put("organs", organList);
            response.put("count", organList.size());
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("승인된 기관 목록 조회 오류", e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", true);
            errorResponse.put("message", "기관 목록 조회 중 오류가 발생했습니다: " + e.getMessage());
            return ResponseEntity.status(500).body(errorResponse);
        }
    }
}

