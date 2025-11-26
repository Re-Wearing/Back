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
}
