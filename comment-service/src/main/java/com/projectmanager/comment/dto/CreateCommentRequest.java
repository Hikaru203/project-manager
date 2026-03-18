package com.projectmanager.comment.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.util.UUID;

@Data
public class CreateCommentRequest {
    @NotNull
    private UUID taskId;
    @NotNull
    private UUID projectId;
    @NotBlank
    private String content;
}
