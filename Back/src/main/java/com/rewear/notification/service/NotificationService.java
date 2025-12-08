package com.rewear.notification.service;

import com.rewear.common.enums.NotificationType;
import com.rewear.notification.entity.Notification;
import com.rewear.user.entity.User;

import java.util.List;

public interface NotificationService {
    Notification createNotification(User user, NotificationType type, String title, String message);
    Notification createNotification(User user, NotificationType type, String title, String message, Long relatedId, String relatedType);
    List<Notification> getUserNotifications(User user);
    List<Notification> getUnreadNotifications(User user);
    Long getUnreadCount(User user);
    void markAsRead(Long notificationId);
    void markAllAsRead(User user);
    void deleteNotification(Long notificationId);
}

