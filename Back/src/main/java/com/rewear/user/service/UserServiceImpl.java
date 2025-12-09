package com.rewear.user.service;


import com.rewear.common.enums.Role;
import com.rewear.common.enums.WarnStatus;
import com.rewear.user.entity.User;
import com.rewear.user.repository.UserRepository;
import com.rewear.notification.repository.NotificationRepository;
import com.rewear.post.repository.PostRepository;
import com.rewear.donation.repository.DonationRepository;
import com.rewear.organ.repository.OrganRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.stereotype.Service;

import java.util.EnumSet;
import java.util.List;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class UserServiceImpl implements UserService{

    private final UserRepository userRepository;
    private final BCryptPasswordEncoder passwordEncoder;
    private final NotificationRepository notificationRepository;
    private final PostRepository postRepository;
    private final DonationRepository donationRepository;
    private final OrganRepository organRepository;

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
        
        // 이메일 검증 (null이 아닌 경우에만 중복 체크)
        if (user.getEmail() != null && !user.getEmail().trim().isEmpty()) {
            if(userRepository.existsByEmail(user.getEmail())){
                throw new IllegalArgumentException("이미 등록된 이메일입니다.");
            }
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
        User user = userRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("삭제할 사용자가 존재하지 않습니다."));
        
        log.info("회원 탈퇴 시작 - userId: {}, username: {}", id, user.getUsername());
        
        try {
            // 1. 알림 삭제
            List<com.rewear.notification.entity.Notification> notifications = 
                    notificationRepository.findByUserOrderByCreatedAtDesc(user);
            if (!notifications.isEmpty()) {
                notificationRepository.deleteAll(notifications);
                log.info("알림 삭제 완료 - 개수: {}", notifications.size());
            }
            
            // 2. 게시글 삭제
            List<com.rewear.post.entity.Post> posts = postRepository.findByAuthorUser(user);
            if (!posts.isEmpty()) {
                postRepository.deleteAll(posts);
                log.info("게시글 삭제 완료 - 개수: {}", posts.size());
            }
            
            // 3. 기부 삭제 (DonationItem과 Delivery는 CASCADE로 자동 삭제됨)
            List<com.rewear.donation.entity.Donation> donations = donationRepository.findByDonor(user);
            if (!donations.isEmpty()) {
                donationRepository.deleteAll(donations);
                log.info("기부 삭제 완료 - 개수: {}", donations.size());
            }
            
            // 4. 기관 정보 삭제 (기관 회원인 경우)
            Optional<com.rewear.organ.entity.Organ> organOpt = organRepository.findByUserId(id);
            if (organOpt.isPresent()) {
                organRepository.delete(organOpt.get());
                log.info("기관 정보 삭제 완료 - organId: {}", organOpt.get().getId());
            }
            
            // 5. 사용자 삭제
            userRepository.deleteById(id);
            log.info("사용자 삭제 완료 - userId: {}, username: {}", id, user.getUsername());
            
        } catch (Exception e) {
            log.error("회원 탈퇴 중 오류 발생 - userId: {}, username: {}", id, user.getUsername(), e);
            throw new RuntimeException("회원 탈퇴 중 오류가 발생했습니다: " + e.getMessage(), e);
        }
    }

    @Override
    public Optional<User> findByNameAndEmail(String name, String email) {
        if (name == null || email == null) {
            return Optional.empty();
        }
        String normalizedName = name.trim();
        String normalizedEmail = email.trim().toLowerCase();
        return userRepository.findByNameAndEmail(normalizedName, normalizedEmail);
    }

    @Override
    public Optional<User> findByUsernameAndEmail(String username, String email) {
        if (username == null || email == null) {
            return Optional.empty();
        }
        String normalizedUsername = username.trim().toLowerCase();
        String normalizedEmail = email.trim().toLowerCase();
        return userRepository.findByUsernameAndEmail(normalizedUsername, normalizedEmail);
    }

    @Override
    @Transactional
    public void resetPassword(String username, String newPassword) {
        if (username == null || newPassword == null || newPassword.trim().isEmpty()) {
            throw new IllegalArgumentException("아이디와 새 비밀번호를 입력해주세요.");
        }
        User user = userRepository.findByUsername(username.trim().toLowerCase())
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));
        
        // 기존 비밀번호와 동일한지 확인
        if (passwordEncoder.matches(newPassword.trim(), user.getPassword())) {
            throw new IllegalArgumentException("기존과 동일한 비밀번호는 사용할 수 없습니다.");
        }
        
        user.setPassword(passwordEncoder.encode(newPassword.trim()));
        userRepository.save(user);
    }

}
