package com.rewear.user.details;

import com.rewear.common.enums.Role; // 실제 패키지에 맞게 조정
import lombok.Getter;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.*;
import java.util.stream.Collectors;

@Getter
public class CustomUserDetails implements UserDetails {

    private final Long id;
    private final String username;
    private final String password;
    private final Set<Role> roles;
    private final boolean enabled;

    public CustomUserDetails(Long id,
                             String username,
                             String password,
                             Set<Role> roles,
                             boolean enabled) {
        this.id = id;
        this.username = username;
        this.password = password;
        this.roles = roles == null ? Collections.emptySet() : roles;
        this.enabled = enabled;
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        // hasRole("ADMIN") 는 내부적으로 "ROLE_ADMIN" 권한을 찾습니다.
        return roles.stream()
                .map(r -> new SimpleGrantedAuthority("ROLE_" + r.name()))
                .collect(Collectors.toUnmodifiableSet());
    }

    @Override public boolean isAccountNonExpired() { return true; }
    @Override public boolean isAccountNonLocked() { return true; }
    @Override public boolean isCredentialsNonExpired() { return true; }
    @Override public boolean isEnabled() { return enabled; }
}
