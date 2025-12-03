package com.rewear.admin.service;

import com.rewear.admin.entity.Admin;
import com.rewear.admin.repository.AdminRepository;
import com.rewear.common.enums.OrganStatus;
import com.rewear.organ.repository.OrganRepository;
import com.rewear.user.entity.User;
import com.rewear.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly=true)
public class AdminServiceImpl {

    private final AdminRepository adminRepository;
    private final BCryptPasswordEncoder passwordEncoder;
    private final UserRepository userRepository;
    private final OrganRepository organRepository;

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

    @Transactional
    public void deleteUserById(Long id){
        if(!userRepository.existsById(id)){
            throw new IllegalArgumentException("해당 사용자가 존재하지 않습니다.");
        }
        userRepository.deleteById(id);
    }
}
