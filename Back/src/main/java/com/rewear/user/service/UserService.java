package com.rewear.user.service;

import com.rewear.user.entity.User;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

public interface UserService {
    public Optional<User> findByUsername(String username);
    public User registerUser(User user);
    public User login(String username, String password);

    public List<User> getAllUsers();

    public boolean isEmailDup(String email);

    public boolean isNicknameDup(String nickname);

    public User getUserById(Long id);

    @Transactional
    public void deleteUser(Long id);

    // 아이디 찾기: 이름과 이메일로 사용자 찾기
    Optional<User> findByNameAndEmail(String name, String email);

    // 비밀번호 찾기: 아이디와 이메일로 사용자 찾기
    Optional<User> findByUsernameAndEmail(String username, String email);

    // 비밀번호 재설정
    @Transactional
    void resetPassword(String username, String newPassword);
}
