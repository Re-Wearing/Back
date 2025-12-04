package com.rewear.signup;

import com.rewear.common.enums.Role;
import com.rewear.user.entity.User;
import com.rewear.user.repository.UserRepository;


import java.util.EnumSet;

public class SignupService {

    UserRepository userRepository;

    public void registerAsUser(User u) {
        // 절대 클라이언트에서 넘어온 roles를 믿지 말 것!
        u.setRoles(EnumSet.of(Role.USER));
        userRepository.save(u);
    }

    public void registerAsOrganGuest(User u) {
        // 기관 가입은 승인 전까지 게스트 권한만
        u.setRoles(EnumSet.of(Role.GUEST));
        // 상태 필드가 있다면 PENDING 등으로
        userRepository.save(u);
    }
}
