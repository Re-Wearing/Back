package com.rewear.config;

import org.springframework.boot.autoconfigure.security.servlet.PathRequest;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.access.AccessDeniedHandler;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import org.springframework.security.web.context.SecurityContextRepository;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity(prePostEnabled = true)
public class SecurityConfig {

    @Bean
    public BCryptPasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                .csrf(csrf -> csrf.disable())

                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(PathRequest.toStaticResources().atCommonLocations()).permitAll()
                        .requestMatchers("/", "/main", "/login", "/signup",
                                "/css/**", "/js/**", "/images/**", "/fragments/**", "/uploads/**").permitAll()
                        .requestMatchers("/api/auth/**").permitAll()
                        .requestMatchers("/faq", "/faq/**").permitAll()
                        .requestMatchers("/admin/**", "/api/admin/**").hasRole("ADMIN")
                        .requestMatchers("/donations/apply", "/donations").hasRole("USER")
                        .requestMatchers("/posts/requests", "/posts/requests/**").hasRole("ORGAN")
                        .requestMatchers("/notifications/**").authenticated()
                        .requestMatchers("/mypage/**").authenticated()
                        .anyRequest().authenticated()
                )

                .exceptionHandling(exceptions -> exceptions
                        .accessDeniedHandler(accessDeniedHandler())
                        .authenticationEntryPoint(authenticationEntryPoint())
                )

                .formLogin(login -> login
                        .loginPage("/login")
                        .loginProcessingUrl("/login")
                        .usernameParameter("username")
                        .passwordParameter("password")
                        .successHandler(authSuccessHandler())
                        .failureUrl("/login?error")
                        .permitAll()
                )

                .logout(out -> out
                        .logoutUrl("/logout")
                        .logoutSuccessUrl("/")
                        .permitAll()
                )

                .sessionManagement(session ->
                        session.sessionCreationPolicy(SessionCreationPolicy.IF_REQUIRED)
                );

        return http.build();
    }

    // 접근 거부 핸들러 (권한이 없을 때)
    @Bean
    public AccessDeniedHandler accessDeniedHandler() {
        return (request, response, accessDeniedException) -> {
            request.getSession().setAttribute("error", "접근 권한이 없습니다. 필요한 권한이 있는 계정으로 로그인해주세요.");
            response.sendRedirect(request.getContextPath() + "/main");
        };
    }

    // 인증되지 않은 사용자 핸들러
    @Bean
    public AuthenticationEntryPoint authenticationEntryPoint() {
        return (request, response, authException) -> {
            request.getSession().setAttribute("error", "로그인이 필요합니다.");
            response.sendRedirect(request.getContextPath() + "/login");
        };
    }

    @Bean
    public org.springframework.security.web.authentication.AuthenticationSuccessHandler authSuccessHandler() {
        return (request, response, authentication) -> {
            boolean isAdmin = authentication.getAuthorities().stream()
                    .anyMatch(a -> "ROLE_ADMIN".equals(a.getAuthority()));
            String target = isAdmin ? "/admin" : "/";
            response.sendRedirect(request.getContextPath() + target);
        };
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration cfg) throws Exception {
        return cfg.getAuthenticationManager();
    }

    @Bean
    public SecurityContextRepository securityContextRepository() {
        return new HttpSessionSecurityContextRepository();
    }
}