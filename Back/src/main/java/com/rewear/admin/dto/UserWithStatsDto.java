package com.rewear.admin.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserWithStatsDto {
    private Long id;
    private String username;
    private String nickname;
    private String email;
    private String role;
    private Long unreadNotificationCount;
    private Long donationCount; // 일반 회원: 기부한 횟수, 기관 회원: 받은 기부 횟수
}

