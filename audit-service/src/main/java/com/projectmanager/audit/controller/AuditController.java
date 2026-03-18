package com.projectmanager.audit.controller;

import com.projectmanager.audit.dto.*;
import com.projectmanager.audit.service.AuditService;
import com.projectmanager.common.dto.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/audit")
@RequiredArgsConstructor
public class AuditController {

    private final AuditService auditService;

    @PostMapping
    public ResponseEntity<ApiResponse<AuditLogResponse>> create(
            @Valid @RequestBody CreateAuditLogRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(auditService.createLog(request)));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<AuditLogResponse>>> list() {
        return ResponseEntity.ok(ApiResponse.success(auditService.getLogs()));
    }

    @GetMapping("/timeline/{entityType}/{entityId}")
    public ResponseEntity<ApiResponse<List<AuditLogResponse>>> timeline(
            @PathVariable String entityType, @PathVariable UUID entityId) {
        return ResponseEntity.ok(ApiResponse.success(auditService.getTimeline(entityType, entityId)));
    }
}
