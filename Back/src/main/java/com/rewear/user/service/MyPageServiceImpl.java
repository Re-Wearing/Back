package com.rewear.user.service;

import com.rewear.user.entity.MyPageInfo;
import com.rewear.user.entity.User;
import com.rewear.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

@Service
@RequiredArgsConstructor
public class MyPageServiceImpl implements MyPageService {

    private final UserRepository userRepository;
    private final BCryptPasswordEncoder passwordEncoder;

    @Override
    public MyPageInfo getMyPageInfo(String userId) {
        User user = userRepository.findByUsername(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        return MyPageInfo.builder()
                .name(user.getName())
                .nickname(user.getNickname())
                .email(user.getEmail())
                .phone(user.getPhone())
                .address(user.getAddress())
                .build();
    }

    @Override
    public boolean checkPassword(String username, String password) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        return passwordEncoder.matches(password, user.getPassword());
    }

    @Override
    @Transactional
    public void updateAll(String userId, MyPageInfo updatedInfo) {
        User user = userRepository.findByUsername(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        // 입력값 검증
        if (updatedInfo.getEmail() == null || updatedInfo.getEmail().isBlank()) {
            throw new IllegalArgumentException("이메일은 필수입니다.");
        }
        if (updatedInfo.getName() == null || updatedInfo.getName().isBlank()) {
            throw new IllegalArgumentException("이름은 필수입니다.");
        }
        if (updatedInfo.getPhone() == null || updatedInfo.getPhone().isBlank()) {
            throw new IllegalArgumentException("전화번호는 필수입니다.");
        }
        
        // 이메일 중복 체크 (현재 사용자의 이메일이 아닌 경우에만)
        if (updatedInfo.getEmail() != null && !updatedInfo.getEmail().equals(user.getEmail())) {
            if (userRepository.existsByEmail(updatedInfo.getEmail())) {
                throw new IllegalArgumentException("이미 사용 중인 이메일입니다.");
            }
        }
        
        // 닉네임 중복 체크 (현재 사용자의 닉네임이 아닌 경우에만)
        if (updatedInfo.getNickname() != null && !updatedInfo.getNickname().equals(user.getNickname())) {
            if (userRepository.existsByNickname(updatedInfo.getNickname())) {
                throw new IllegalArgumentException("이미 사용 중인 닉네임입니다.");
            }
        }
        
        user.setName(updatedInfo.getName());
        user.setNickname(updatedInfo.getNickname());
        user.setEmail(updatedInfo.getEmail());
        user.setPhone(updatedInfo.getPhone());
        user.setAddress(updatedInfo.getAddress());

        userRepository.save(user);
    }

    @Override
    @Transactional
    public void updatePassword(String userId, String currentPassword, String newPassword) {
        User user = userRepository.findByUsername(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        // 현재 비밀번호 확인
        if (!passwordEncoder.matches(currentPassword, user.getPassword())) {
            throw new IllegalArgumentException("현재 비밀번호가 일치하지 않습니다.");
        }
        
        // 새 비밀번호 유효성 검증
        if (newPassword == null || newPassword.isBlank()) {
            throw new IllegalArgumentException("새 비밀번호를 입력해주세요.");
        }
        
        if (newPassword.length() < 5) {
            throw new IllegalArgumentException("비밀번호는 최소 5자 이상이어야 합니다.");
        }
        
        // 새 비밀번호 암호화 후 저장
        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);
    }

}
