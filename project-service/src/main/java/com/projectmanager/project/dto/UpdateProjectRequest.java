package com.projectmanager.project.dto;

import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class UpdateProjectRequest {
    @Size(max = 255)
    private String name;
    private String description;
    @Size(max = 50)
    private String icon;
    private String color;
    private String status;
}
