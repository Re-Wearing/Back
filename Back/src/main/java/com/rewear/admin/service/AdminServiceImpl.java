package com.rewear.admin.service;

import com.rewear.admin.dto.UserWithStatsDto;
import com.rewear.admin.entity.Admin;
import com.rewear.admin.repository.AdminRepository;
import com.rewear.common.enums.OrganStatus;
import com.rewear.donation.repository.DonationRepository;
import com.rewear.notification.repository.NotificationRepository;
import com.rewear.organ.entity.Organ;
import com.rewear.organ.repository.OrganRepository;
import com.rewear.user.entity.User;
import com.rewear.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly=true)
public class AdminServiceImpl {

    private final AdminRepository adminRepository;
    private final BCryptPasswordEncoder passwordEncoder;
    private final UserRepository userRepository;
    private final OrganRepository organRepository;
    private final NotificationRepository notificationRepository;
    private final DonationRepository donationRepository;

    public Admin login(String username, String password){
        Admin admin = adminRepository.findById(username)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 관리자입니다."));
        if(!passwordEncoder.matches(password,admin.getPassword())){
            throw new IllegalArgumentException("비밀번호가 일치하지 않습니다.");
        }
        return admin;
    }

    public List<User> getAllUsers(){
        List<User> allUsers = userRepository.findAll();
        // 승인되지 않은 기관 계정(PENDING, REJECTED) 제외
        return allUsers.stream()
                .filter(user -> {
                    // Organ이 있는 경우, APPROVED 상태인 경우만 포함
                    return organRepository.findByUserId(user.getId())
                            .map(organ -> organ.getStatus() == OrganStatus.APPROVED)
                            .orElse(true); // Organ이 없으면 일반 사용자이므로 포함
                })
                .collect(Collectors.toList());
    }

    /**
     * 사용자 목록과 통계 정보를 함께 반환
     */
    public List<UserWithStatsDto> getAllUsersWithStats() {
        List<User> users = getAllUsers();
        
        return users.stream().map(user -> {
            // 읽지 않은 알림 수
            Long unreadCount = notificationRepository.countByUserAndIsReadFalse(user);
            
            // 기부 횟수 계산
            Long donationCount = 0L;
            
            // 일반 회원: 기부한 횟수
            if (user.getRoles() != null && user.getRoles().contains(com.rewear.common.enums.Role.USER)) {
                donationCount = (long) donationRepository.findByDonor(user).size();
            }
            // 기관 회원: 받은 기부 횟수
            else if (user.getRoles() != null && user.getRoles().contains(com.rewear.common.enums.Role.ORGAN)) {
                Organ organ = organRepository.findByUserId(user.getId()).orElse(null);
                if (organ != null) {
                    donationCount = (long) donationRepository.findByOrganId(organ.getId()).size();
                }
            }
            
            // 역할 문자열 변환
            String roleStr = "일반 회원";
            if (user.getRoles() != null && user.getRoles().contains(com.rewear.common.enums.Role.ADMIN)) {
                roleStr = "관리자 회원";
            } else if (user.getRoles() != null && user.getRoles().contains(com.rewear.common.enums.Role.ORGAN)) {
                roleStr = "기관 회원";
            }
            
            return UserWithStatsDto.builder()
                    .id(user.getId())
                    .username(user.getUsername())
                    .nickname(user.getNickname())
                    .email(user.getEmail())
                    .role(roleStr)
                    .unreadNotificationCount(unreadCount)
                    .donationCount(donationCount)
                    .build();
        }).collect(Collectors.toList());
    }

    @Transactional
    public void deleteUserById(Long id){
        if(!userRepository.existsById(id)){
            throw new IllegalArgumentException("해당 사용자가 존재하지 않습니다.");
        }
        userRepository.deleteById(id);
    }

    @Transactional
    public void resetUserPassword(Long id){
        User user = userRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("해당 사용자가 존재하지 않습니다."));
        // 기본 비밀번호로 초기화 (rewear123!)
        String defaultPassword = "rewear123!";
        user.setPassword(passwordEncoder.encode(defaultPassword));
        userRepository.save(user);
    }
}
