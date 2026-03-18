package com.projectmanager.notification.dto;

import lombok.Builder;
import lombok.Data;
import java.time.Instant;
import java.util.UUID;

@Data
@Builder
public class NotificationResponse {
    private UUID id;
    private String type;
    private String title;
    private String message;
    private UUID referenceId;
    private String referenceType;
    private boolean isRead;
    private Instant createdAt;
}
