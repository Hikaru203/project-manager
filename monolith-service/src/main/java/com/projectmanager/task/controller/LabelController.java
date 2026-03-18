package com.projectmanager.task.controller;

import com.projectmanager.common.dto.ApiResponse;
import com.projectmanager.task.dto.TaskResponse;
import com.projectmanager.task.service.TaskService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/labels")
@RequiredArgsConstructor
public class LabelController {

    private final TaskService taskService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<TaskResponse.LabelResponse>>> list(@RequestParam UUID projectId) {
        return ResponseEntity.ok(ApiResponse.success(taskService.getLabels(projectId)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<TaskResponse.LabelResponse>> create(@RequestBody Map<String, String> body) {
        UUID projectId = UUID.fromString(body.get("projectId"));
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(taskService.createLabel(projectId, body.get("name"), body.get("color"))));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID id) {
        taskService.deleteLabel(id);
        return ResponseEntity.ok(ApiResponse.success(null, "Label deleted"));
    }
}
