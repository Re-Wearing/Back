package com.rewear.user.details;

import com.rewear.common.enums.OrganStatus;
import com.rewear.common.enums.WarnStatus;
import com.rewear.organ.repository.OrganRepository;
import com.rewear.common.enums.Role;
import com.rewear.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.authentication.LockedException;
import org.springframework.security.core.userdetails.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class CustomUserDetailsService implements UserDetailsService {

    private final UserRepository userRepository;
    private final OrganRepository organRepository;

    @Override
    @Transactional(readOnly = true)
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        var user = userRepository.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("user not found: " + username));

        // 1. 계정 정지(BANNED) 상태 확인 - 모든 사용자 공통
        if (user.getStatus() == WarnStatus.BANNED) {
            throw new LockedException("이용이 정지된 계정입니다.");
        }

        // 2. 기관(Role.ORGAN) 계정이면 Organ 승인여부 확인
        if (user.getRoles() != null && user.getRoles().contains(Role.ORGAN)) {
            var organOpt = organRepository.findByUserId(user.getId());
            if (organOpt.isEmpty()) {
                // Organ row가 없다면 로그인 차단
                throw new DisabledException("기관 정보가 존재하지 않습니다.");
            }
            
            var organStatus = organOpt.get().getStatus();
            if (organStatus == OrganStatus.PENDING) {
                throw new DisabledException("아직 승인되지 않은 계정입니다. 관리자 승인을 기다려주세요.");
            } else if (organStatus == OrganStatus.REJECTED) {
                throw new DisabledException("승인이 거부된 계정입니다. 관리자에게 문의해주세요.");
            }
        }

        // 주의: user.getPassword()는 반드시 BCrypt 등으로 인코딩된 값이어야 합니다.
        return new CustomUserDetails(
                user.getId(),
                user.getUsername(),
                user.getPassword(),
                user.getRoles(),
                true  // 여기까지 왔으면 enabled = true
        );
    }
}
