package com.projectmanager.notification.service;

import com.projectmanager.common.security.UserContext;
import com.projectmanager.notification.domain.Notification;
import com.projectmanager.notification.dto.*;
import com.projectmanager.notification.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final SimpMessagingTemplate messagingTemplate;

    @Transactional
    public NotificationResponse createNotification(CreateNotificationRequest request) {
        UUID tenantId = UserContext.getCurrentTenantId();
        Notification notification = Notification.builder()
                .tenantId(tenantId)
                .userId(request.getUserId())
                .type(request.getType())
                .title(request.getTitle())
                .message(request.getMessage())
                .referenceId(request.getReferenceId())
                .referenceType(request.getReferenceType())
                .build();
        notification = notificationRepository.save(notification);

        NotificationResponse response = toResponse(notification);
        // Send via WebSocket
        messagingTemplate.convertAndSend(
                "/topic/notifications/" + request.getUserId(), response);

        return response;
    }

    public List<NotificationResponse> getMyNotifications() {
        UUID userId = UserContext.getCurrentUserId();
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(userId)
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    public long getUnreadCount() {
        return notificationRepository.countByUserIdAndIsReadFalse(UserContext.getCurrentUserId());
    }

    @Transactional
    public void markAsRead(UUID notificationId) {
        notificationRepository.findById(notificationId).ifPresent(n -> {
            n.setRead(true);
            notificationRepository.save(n);
        });
    }

    @Transactional
    public void markAllAsRead() {
        notificationRepository.markAllAsRead(UserContext.getCurrentUserId());
    }

    private NotificationResponse toResponse(Notification n) {
        return NotificationResponse.builder()
                .id(n.getId()).type(n.getType()).title(n.getTitle())
                .message(n.getMessage()).referenceId(n.getReferenceId())
                .referenceType(n.getReferenceType()).isRead(n.isRead())
                .createdAt(n.getCreatedAt()).build();
    }
}
