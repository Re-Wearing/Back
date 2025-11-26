package com.rewear.notification.controller;

import com.rewear.notification.entity.Notification;
import com.rewear.notification.service.NotificationService;
import com.rewear.user.details.CustomUserDetails;
import com.rewear.user.entity.User;
import com.rewear.user.service.UserServiceImpl;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Controller
@RequestMapping("/notifications")
@RequiredArgsConstructor
@PreAuthorize("isAuthenticated()")
public class NotificationController {

    private final NotificationService notificationService;
    private final UserServiceImpl userService;

    @GetMapping
    public String notificationList(
            @AuthenticationPrincipal CustomUserDetails principal,
            Model model) {
        
        User user = userService.findByUsername(principal.getUsername())
                .orElseThrow(() -> new IllegalStateException("사용자를 찾을 수 없습니다."));

        List<Notification> notifications = notificationService.getUserNotifications(user);
        Long unreadCount = notificationService.getUnreadCount(user);

        model.addAttribute("notifications", notifications);
        model.addAttribute("unreadCount", unreadCount);
        return "notification/list";
    }

    @PostMapping("/{notificationId}/read")
    @ResponseBody
    public ResponseEntity<Map<String, Object>> markAsRead(
            @PathVariable Long notificationId,
            @AuthenticationPrincipal CustomUserDetails principal) {
        
        User user = userService.findByUsername(principal.getUsername())
                .orElseThrow(() -> new IllegalStateException("사용자를 찾을 수 없습니다."));

        notificationService.markAsRead(notificationId);
        
        Long unreadCount = notificationService.getUnreadCount(user);
        
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("unreadCount", unreadCount);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/read-all")
    @ResponseBody
    public ResponseEntity<Map<String, Object>> markAllAsRead(
            @AuthenticationPrincipal CustomUserDetails principal) {
        
        User user = userService.findByUsername(principal.getUsername())
                .orElseThrow(() -> new IllegalStateException("사용자를 찾을 수 없습니다."));

        notificationService.markAllAsRead(user);
        
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("unreadCount", 0L);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/unread-count")
    @ResponseBody
    public ResponseEntity<Map<String, Object>> getUnreadCount(
            @AuthenticationPrincipal CustomUserDetails principal) {
        
        User user = userService.findByUsername(principal.getUsername())
                .orElseThrow(() -> new IllegalStateException("사용자를 찾을 수 없습니다."));

        Long unreadCount = notificationService.getUnreadCount(user);
        
        Map<String, Object> response = new HashMap<>();
        response.put("unreadCount", unreadCount);
        return ResponseEntity.ok(response);
    }
}

