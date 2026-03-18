package com.projectmanager.notification.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.util.UUID;

@Data
public class CreateNotificationRequest {
    @NotNull
    private UUID userId;
    @NotBlank
    private String type;
    @NotBlank
    private String title;
    private String message;
    private UUID referenceId;
    private String referenceType;
}
