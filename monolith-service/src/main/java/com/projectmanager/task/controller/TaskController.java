package com.projectmanager.task.controller;

import com.projectmanager.common.dto.ApiResponse;
import com.projectmanager.task.dto.*;
import com.projectmanager.task.service.TaskService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/tasks")
@RequiredArgsConstructor
public class TaskController {

    private final TaskService taskService;

    @PostMapping
    public ResponseEntity<ApiResponse<TaskResponse>> create(@Valid @RequestBody CreateTaskRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(taskService.createTask(request), "Task created"));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<TaskResponse>>> list(
            @RequestParam UUID projectId,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) UUID assigneeId,
            @RequestParam(required = false) String search) {
        return ResponseEntity.ok(ApiResponse.success(taskService.getTasks(projectId, status, assigneeId, search)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<TaskResponse>> getById(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success(taskService.getTask(id)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<TaskResponse>> update(@PathVariable UUID id,
                                                             @Valid @RequestBody UpdateTaskRequest request) {
        return ResponseEntity.ok(ApiResponse.success(taskService.updateTask(id, request)));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<ApiResponse<TaskResponse>> updateStatus(@PathVariable UUID id,
                                                                    @RequestBody Map<String, String> body) {
        return ResponseEntity.ok(ApiResponse.success(taskService.updateStatus(id, body.get("status"))));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID id) {
        taskService.deleteTask(id);
        return ResponseEntity.ok(ApiResponse.success(null, "Task deleted"));
    }

    @GetMapping("/stats")
    public ResponseEntity<ApiResponse<Map<String, Long>>> stats(@RequestParam UUID projectId) {
        return ResponseEntity.ok(ApiResponse.success(taskService.getStats(projectId)));
    }
}
