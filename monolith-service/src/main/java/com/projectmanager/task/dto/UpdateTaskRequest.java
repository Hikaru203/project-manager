package com.projectmanager.task.dto;

import lombok.Data;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Data
public class UpdateTaskRequest {
    private String title;
    private String description;
    private String status;
    private String priority;
    private UUID assigneeId;
    private String assigneeName;
    private Instant deadline;
    private List<UUID> labelIds;
    private Integer position;
}
