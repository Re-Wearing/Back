package com.rewear.user.repository;


import com.rewear.user.entity.User;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    @EntityGraph(attributePaths = "roles")
    Optional<User> findByUsername(String username);

    @EntityGraph(attributePaths = "roles")
    boolean existsByEmail(String email);

    boolean existsByNickname(String nickname);

    // 아이디 찾기: 이름과 이메일로 사용자 찾기
    @EntityGraph(attributePaths = "roles")
    Optional<User> findByNameAndEmail(String name, String email);

    // 비밀번호 찾기: 아이디와 이메일로 사용자 찾기
    @EntityGraph(attributePaths = "roles")
    Optional<User> findByUsernameAndEmail(String username, String email);

}
