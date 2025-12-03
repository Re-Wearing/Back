package com.rewear.user.service;


import com.rewear.common.enums.Role;
import com.rewear.common.enums.WarnStatus;
import com.rewear.user.entity.User;
import com.rewear.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.stereotype.Service;

import java.util.EnumSet;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class UserServiceImpl implements UserService{

    private final UserRepository userRepository;
    private final BCryptPasswordEncoder passwordEncoder;

    public Optional<User> findByUsername(String username) {
        if (username == null) return Optional.empty();
        String u = username.trim();
        if (u.isEmpty()) return Optional.empty();
        return userRepository.findByUsername(u);
    }

    @Transactional
    public User registerUser(User user){
        // 아이디 길이 검증
        if (user.getUsername() == null || user.getUsername().length() < 5 || user.getUsername().length() > 12) {
            throw new IllegalArgumentException("아이디는 5~12자 사이여야 합니다.");
        }
        
        // 아이디 형식 검증
        if (!user.getUsername().matches("^[A-Za-z0-9]+$")) {
            throw new IllegalArgumentException("아이디는 영문과 숫자만 사용할 수 있습니다.");
        }
        
        // 비밀번호 길이 검증
        if (user.getPassword() == null || user.getPassword().length() < 5) {
            throw new IllegalArgumentException("비밀번호는 최소 5자 이상이어야 합니다.");
        }
        
        if(userRepository.existsByEmail(user.getEmail())){
            throw new IllegalArgumentException("이미 등록된 이메일입니다.");
        }

        if(userRepository.findByUsername(user.getUsername()).isPresent()){
            throw new IllegalArgumentException("이미 존재하는 아이디입니다");
        }

        user.setPassword(passwordEncoder.encode(user.getPassword()));

        if (user.getRoles() == null || user.getRoles().isEmpty()){
            user.setRoles(EnumSet.of(Role.USER));
        }

        // 닉네임이 null이거나 빈 문자열이면 아이디로 설정
        if (user.getNickname() == null || user.getNickname().trim().isEmpty()){
            user.setNickname(user.getUsername());
        }

        // 신규 회원 기본값 설정
        user.setStatus(WarnStatus.NORMAL);    // 상태: NORMAL
        user.setWarnCount(0);                  // 경고 누적 횟수: 0
        user.setLoginFailCount(0);             // 로그인 실패 횟수: 0
        user.setIsLocked(false);               // 잠금: false (0)
        // createdAt, updatedAt은 @CreationTimestamp, @UpdateTimestamp로 자동 설정

        return userRepository.save(user);
    }

    public User login(String username, String password){
        Optional<User> optionalUser = userRepository.findByUsername(username);
        if(optionalUser.isEmpty()){
            throw new IllegalArgumentException("존재하지 않는 아이디입니다.");
        }

        User user = optionalUser.get();
        if(!passwordEncoder.matches(password,user.getPassword())){
            throw new IllegalArgumentException("비밀번호가 일치하지 않습니다.");
        }

        return user;
    }

    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    public boolean isEmailDup(String email){
        return userRepository.existsByEmail(email);
    }

    public boolean isNicknameDup(String nickname){
        return userRepository.existsByNickname(nickname);
    }

    public User getUserById(Long id){
        return userRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("해당 사용자를 찾을 수 없습니다."));
    }

    @Transactional
    public void deleteUser(Long id) {
        if (!userRepository.existsById(id)) {
            throw new IllegalArgumentException("삭제할 사용자가 존재하지 않습니다.");
        }
        userRepository.deleteById(id);
    }

}
