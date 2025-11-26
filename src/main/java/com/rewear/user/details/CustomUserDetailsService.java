package com.rewear.user.details;

import com.rewear.common.enums.OrganStatus;
import com.rewear.organ.repository.OrganRepository;
import com.rewear.common.enums.Role;          // 실제 패키지 확인
import com.rewear.user.repository.UserRepository; // 실제 패키지 확인
import lombok.RequiredArgsConstructor;
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

        // 기본은 로그인 허용
        boolean enabled = true;

        // 기관(Role.ORGAN) 계정이면 Organ 승인여부 확인
        if (user.getRoles() != null && user.getRoles().contains(Role.ORGAN)) {
            var organOpt = organRepository.findByUserId(user.getId());
            if (organOpt.isEmpty()) {
                // 안전하게: Organ row가 없다면 로그인 차단
                enabled = false;
            } else {
                var st = organOpt.get().getStatus();
                // 승인(APPROVED)만 통과, 나머지(PENDING/REJECTED 등)는 차단
                if (st != OrganStatus.APPROVED) {
                    enabled = false;
                }
            }
        }

        // 주의: user.getPassword()는 반드시 BCrypt 등으로 인코딩된 값이어야 합니다.
        return new CustomUserDetails(
                user.getId(),
                user.getUsername(),
                user.getPassword(),
                user.getRoles(),
                enabled
        );
    }
}
