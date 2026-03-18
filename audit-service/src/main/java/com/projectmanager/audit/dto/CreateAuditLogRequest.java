package com.projectmanager.audit.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import java.util.Map;
import java.util.UUID;

@Data
public class CreateAuditLogRequest {
    @NotBlank
    private String action;
    private String entityType;
    private UUID entityId;
    private Map<String, Object> oldValue;
    private Map<String, Object> newValue;
    private String ipAddress;
}
