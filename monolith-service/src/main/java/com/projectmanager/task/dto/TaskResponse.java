package com.projectmanager.task.dto;

import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@Data
@Builder
public class TaskResponse {
    private UUID id;
    private UUID projectId;
    private String title;
    private String description;
    private String status;
    private String priority;
    private UUID creatorId;
    private String creatorName;
    private Set<UUID> assigneeIds;
    private Instant deadline;
    private int position;
    private List<LabelResponse> labels;
    private Instant createdAt;
    private Instant updatedAt;

    @Data
    @Builder
    public static class LabelResponse {
        private UUID id;
        private String name;
        private String color;
    }
}
