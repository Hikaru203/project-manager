package com.projectmanager.task.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Data
public class CreateTaskRequest {
    @NotNull
    private UUID projectId;
    @NotBlank
    private String title;
    private String description;
    private String status = "TODO";
    private String priority = "MEDIUM";
    private List<UUID> assigneeIds;
    private Instant deadline;
    private List<UUID> labelIds;
}
