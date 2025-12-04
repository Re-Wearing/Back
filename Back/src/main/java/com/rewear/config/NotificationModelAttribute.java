package com.rewear.config;

import com.rewear.common.enums.Role;
import com.rewear.notification.service.NotificationService;
import com.rewear.user.details.CustomUserDetails;
import com.rewear.user.entity.User;
import com.rewear.user.service.UserServiceImpl;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;
import org.springframework.web.servlet.ModelAndView;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@Component
@RequiredArgsConstructor
public class NotificationModelAttribute implements HandlerInterceptor {

    private final NotificationService notificationService;
    private final UserServiceImpl userService;

    @Override
    public void postHandle(HttpServletRequest request, HttpServletResponse response, 
                          Object handler, ModelAndView modelAndView) throws Exception {
        if (modelAndView != null) {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            if (authentication != null && authentication.isAuthenticated() 
                && authentication.getPrincipal() instanceof CustomUserDetails) {
                try {
                    CustomUserDetails userDetails = (CustomUserDetails) authentication.getPrincipal();
                    User user = userService.findByUsername(userDetails.getUsername())
                            .orElse(null);
                    if (user != null && !user.hasRole(Role.ADMIN)) {
                        Long unreadCount = notificationService.getUnreadCount(user);
                        modelAndView.addObject("unreadNotificationCount", unreadCount);
                    }
                } catch (Exception e) {
                    // 알림 카운트 조회 실패 시 무시
                }
            }
        }
    }
}

