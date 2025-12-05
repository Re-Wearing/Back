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
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
@PreAuthorize("isAuthenticated()")
public class NotificationApiController {

    private final NotificationService notificationService;
    private final UserServiceImpl userService;

    /**
     * 알림 목록 조회 API
     */
    @GetMapping
    public ResponseEntity<Map<String, Object>> getNotifications(
            @AuthenticationPrincipal CustomUserDetails principal) {
        
        User user = userService.findByUsername(principal.getUsername())
                .orElseThrow(() -> new IllegalStateException("사용자를 찾을 수 없습니다."));

        List<Notification> notifications = notificationService.getUserNotifications(user);
        Long unreadCount = notificationService.getUnreadCount(user);

        // Notification 엔티티를 프론트엔드에서 사용할 수 있는 형태로 변환
        List<Map<String, Object>> notificationList = notifications.stream()
                .map(notification -> {
                    Map<String, Object> item = new HashMap<>();
                    item.put("id", notification.getId());
                    item.put("title", notification.getTitle());
                    item.put("description", notification.getMessage());
                    item.put("read", notification.getIsRead());
                    item.put("date", notification.getCreatedAt().toString());
                    item.put("type", notification.getType() != null ? notification.getType().name().toLowerCase() : "info");
                    item.put("relatedId", notification.getRelatedId());
                    item.put("relatedType", notification.getRelatedType());
                    return item;
                })
                .collect(Collectors.toList());

        Map<String, Object> response = new HashMap<>();
        response.put("notifications", notificationList);
        response.put("unreadCount", unreadCount);
        
        return ResponseEntity.ok(response);
    }

    /**
     * 개별 알림 읽음 처리 API
     */
    @PostMapping("/{notificationId}/read")
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

    /**
     * 전체 알림 읽음 처리 API
     */
    @PostMapping("/read-all")
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

    /**
     * 읽지 않은 알림 개수 조회 API
     */
    @GetMapping("/unread-count")
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

