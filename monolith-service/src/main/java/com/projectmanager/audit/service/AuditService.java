package com.projectmanager.audit.service;

import com.projectmanager.audit.domain.AuditLog;
import com.projectmanager.audit.dto.*;
import com.projectmanager.audit.repository.AuditLogRepository;
import com.projectmanager.common.security.UserContext;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AuditService {

    private final AuditLogRepository auditLogRepository;

    public AuditLogResponse createLog(CreateAuditLogRequest request) {
        AuditLog log = AuditLog.builder()
                .tenantId(UserContext.getCurrentTenantId())
                .userId(UserContext.getCurrentUserId())
                .username(UserContext.getCurrentUsername())
                .action(request.getAction())
                .entityType(request.getEntityType())
                .entityId(request.getEntityId())
                .oldValue(request.getOldValue())
                .newValue(request.getNewValue())
                .ipAddress(request.getIpAddress())
                .build();
        return toResponse(auditLogRepository.save(log));
    }

    public List<AuditLogResponse> getLogs() {
        UUID tenantId = UserContext.getCurrentTenantId();
        return auditLogRepository.findByTenantIdOrderByCreatedAtDesc(tenantId)
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    public List<AuditLogResponse> getTimeline(String entityType, UUID entityId) {
        return auditLogRepository.findByEntityTypeAndEntityIdOrderByCreatedAtDesc(entityType, entityId)
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    private AuditLogResponse toResponse(AuditLog l) {
        StringBuilder details = new StringBuilder();
        details.append(l.getAction().replace("_", " ").toLowerCase());
        if (l.getEntityType() != null) {
            details.append(" ").append(l.getEntityType().toLowerCase());
        }
        
        if (l.getOldValue() != null && l.getNewValue() != null) {
            // For status changes, make it more readable
            if (l.getOldValue().containsKey("status") && l.getNewValue().containsKey("status")) {
                details.append(" from ").append(l.getOldValue().get("status"))
                       .append(" to ").append(l.getNewValue().get("status"));
            }
        }

        return AuditLogResponse.builder()
                .id(l.getId())
                .actorId(l.getUserId())
                .actorName(l.getUsername())
                .action(l.getAction())
                .entityType(l.getEntityType())
                .entityId(l.getEntityId())
                .oldValue(l.getOldValue())
                .newValue(l.getNewValue())
                .details(details.toString())
                .ipAddress(l.getIpAddress())
                .createdAt(l.getCreatedAt())
                .build();
    }
}
