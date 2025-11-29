package com.rewear.config;

import org.springframework.boot.autoconfigure.security.servlet.PathRequest;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
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
import org.springframework.security.web.authentication.AuthenticationFailureHandler;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import org.springframework.security.web.context.SecurityContextRepository;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

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
                        .requestMatchers(HttpMethod.GET, "/faq", "/faq/**").permitAll()
                        .requestMatchers(HttpMethod.POST, "/faq/question").authenticated()
                        .requestMatchers(HttpMethod.GET, "/posts", "/posts/reviews", "/posts/reviews/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/posts/{postId:\\d+}").permitAll()
                        .requestMatchers(HttpMethod.GET, "/posts/requests", "/posts/requests/**").authenticated()
                        .requestMatchers(HttpMethod.POST, "/posts").authenticated()
                        .requestMatchers("/admin/**", "/api/admin/**").hasRole("ADMIN")
                        .requestMatchers("/donations/apply", "/donations").hasRole("USER")
                        .requestMatchers("/posts/new").authenticated()
                        .requestMatchers("/posts/*/edit", "/posts/*/delete").authenticated()
                        .requestMatchers("/notifications/**").authenticated()
                        .requestMatchers("/mypage", "/mypage/**").authenticated()
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
                        .failureHandler(authFailureHandler())
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
    public AuthenticationFailureHandler authFailureHandler() {
        return (request, response, exception) -> {
            String errorMessage;
            
            // 실제 예외 추출 (InternalAuthenticationServiceException으로 감싸진 경우 cause 확인)
            Throwable cause = exception.getCause();
            
            // 예외 타입에 따라 다른 메시지 설정
            if (exception instanceof org.springframework.security.authentication.LockedException) {
                errorMessage = exception.getMessage();
            } else if (exception instanceof org.springframework.security.authentication.DisabledException) {
                errorMessage = exception.getMessage();
            } else if (cause instanceof org.springframework.security.authentication.LockedException) {
                // InternalAuthenticationServiceException으로 감싸진 LockedException
                errorMessage = cause.getMessage();
            } else if (cause instanceof org.springframework.security.authentication.DisabledException) {
                // InternalAuthenticationServiceException으로 감싸진 DisabledException
                errorMessage = cause.getMessage();
            } else if (exception instanceof org.springframework.security.authentication.BadCredentialsException) {
                errorMessage = "아이디 또는 비밀번호가 올바르지 않습니다.";
            } else if (exception instanceof org.springframework.security.core.userdetails.UsernameNotFoundException) {
                errorMessage = "아이디 또는 비밀번호가 올바르지 않습니다.";
            } else {
                // 기타 인증 오류
                errorMessage = "로그인에 실패했습니다.";
            }
            
            // URL 인코딩하여 쿼리 파라미터로 전달
            String encodedMessage = URLEncoder.encode(errorMessage, StandardCharsets.UTF_8);
            response.sendRedirect(request.getContextPath() + "/login?error=" + encodedMessage);
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