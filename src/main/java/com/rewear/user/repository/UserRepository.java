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

}
