package com.rewear.admin.service;

import com.rewear.admin.entity.Admin;
import com.rewear.admin.repository.AdminRepository;
import com.rewear.user.entity.User;
import com.rewear.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly=true)
public class AdminServiceImpl {

    private final AdminRepository adminRepository;
    private final BCryptPasswordEncoder passwordEncoder;
    private final UserRepository userRepository;

    public Admin login(String username, String password){
        Admin admin = adminRepository.findById(username)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 관리자입니다."));
        if(!passwordEncoder.matches(password,admin.getPassword())){
            throw new IllegalArgumentException("비밀번호가 일치하지 않습니다.");
        }
        return admin;
    }

    public List<User> getAllUsers(){
        return userRepository.findAll();
    }

    @Transactional
    public void deleteUserById(Long id){
        if(!userRepository.existsById(id)){
            throw new IllegalArgumentException("해당 사용자가 존재하지 않습니다.");
        }
        userRepository.deleteById(id);
    }
}
