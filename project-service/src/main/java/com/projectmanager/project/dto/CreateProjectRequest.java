package com.projectmanager.project.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class CreateProjectRequest {
    @NotBlank
    @Size(max = 255)
    private String name;

    private String description;

    @NotBlank
    @Size(min = 2, max = 10)
    @Pattern(regexp = "^[A-Z0-9]+$", message = "Key must be uppercase letters and numbers only")
    private String key;

    @Size(max = 50)
    private String icon;

    @Pattern(regexp = "^#[0-9a-fA-F]{6}$", message = "Color must be a valid hex color")
    private String color;
}
