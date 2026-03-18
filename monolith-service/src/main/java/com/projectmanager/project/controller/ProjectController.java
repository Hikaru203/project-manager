package com.projectmanager.project.controller;

import com.projectmanager.common.dto.ApiResponse;
import com.projectmanager.project.dto.*;
import com.projectmanager.project.service.ProjectService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/projects")
@RequiredArgsConstructor
public class ProjectController {

    private final ProjectService projectService;

    @PostMapping
    public ResponseEntity<ApiResponse<ProjectResponse>> create(@Valid @RequestBody CreateProjectRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(projectService.createProject(request), "Project created"));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<ProjectResponse>>> list() {
        return ResponseEntity.ok(ApiResponse.success(projectService.getMyProjects()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ProjectResponse>> getById(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success(projectService.getProject(id)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<ProjectResponse>> update(@PathVariable UUID id,
                                                                @Valid @RequestBody UpdateProjectRequest request) {
        return ResponseEntity.ok(ApiResponse.success(projectService.updateProject(id, request)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID id) {
        projectService.deleteProject(id);
        return ResponseEntity.ok(ApiResponse.success(null, "Project deleted"));
    }

    @PostMapping("/{id}/members")
    public ResponseEntity<ApiResponse<ProjectResponse.MemberResponse>> addMember(
            @PathVariable UUID id, @Valid @RequestBody AddMemberRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(projectService.addMember(id, request)));
    }

    @GetMapping("/{id}/members")
    public ResponseEntity<ApiResponse<List<ProjectResponse.MemberResponse>>> getMembers(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success(projectService.getMembers(id)));
    }

    @DeleteMapping("/{id}/members/{userId}")
    public ResponseEntity<ApiResponse<Void>> removeMember(@PathVariable UUID id, @PathVariable UUID userId) {
        projectService.removeMember(id, userId);
        return ResponseEntity.ok(ApiResponse.success(null, "Member removed"));
    }
}
