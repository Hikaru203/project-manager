package com.projectmanager.project.dto;

import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Data
@Builder
public class ProjectResponse {
    private UUID id;
    private String name;
    private String description;
    private String key;
    private UUID ownerId;
    private String ownerName;
    private String status;
    private String icon;
    private String color;
    private int memberCount;
    private List<MemberResponse> members;
    private Instant createdAt;
    private Instant updatedAt;

    @Data
    @Builder
    public static class MemberResponse {
        private UUID id;
        private UUID userId;
        private String username;
        private String role;
        private Instant joinedAt;
    }
}
