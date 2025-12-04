package com.rewear.organ.controller;

import com.rewear.common.enums.OrganStatus;
import com.rewear.organ.dto.OrganSummaryResponse;
import com.rewear.organ.service.OrganService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/organs")
@RequiredArgsConstructor
public class OrganApiController {

    private final OrganService organService;

    @GetMapping("/approved")
    public ResponseEntity<?> getApprovedOrgans() {
        List<OrganSummaryResponse> organs = organService.findByStatus(OrganStatus.APPROVED)
                .stream()
                .map(OrganSummaryResponse::from)
                .toList();

        return ResponseEntity.ok(Map.of(
                "ok", true,
                "organs", organs
        ));
    }
}

