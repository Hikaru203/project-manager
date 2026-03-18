package com.projectmanager.task.service;

import com.projectmanager.common.exception.*;
import com.projectmanager.common.security.UserContext;
import com.projectmanager.task.domain.*;
import com.projectmanager.task.dto.*;
import com.projectmanager.task.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TaskService {

    private final TaskRepository taskRepository;
    private final TaskLabelRepository labelRepository;

    @Transactional
    public TaskResponse createTask(CreateTaskRequest request) {
        UUID tenantId = UserContext.getCurrentTenantId();

        Integer maxPos = taskRepository.findMaxPositionByProjectAndStatus(
                request.getProjectId(), TaskStatus.valueOf(request.getStatus()));
        int position = (maxPos != null ? maxPos : 0) + 1;

        Task task = Task.builder()
                .projectId(request.getProjectId())
                .tenantId(tenantId)
                .title(request.getTitle())
                .description(request.getDescription())
                .status(TaskStatus.valueOf(request.getStatus()))
                .priority(TaskPriority.valueOf(request.getPriority()))
                .creatorId(UserContext.getCurrentUserId())
                .creatorName(UserContext.getCurrentUsername())
                .assigneeId(request.getAssigneeId())
                .assigneeName(request.getAssigneeName())
                .deadline(request.getDeadline())
                .position(position)
                .build();

        if (request.getLabelIds() != null && !request.getLabelIds().isEmpty()) {
            Set<TaskLabel> labels = new HashSet<>(labelRepository.findAllById(request.getLabelIds()));
            task.setLabels(labels);
        }

        return toResponse(taskRepository.save(task));
    }

    public List<TaskResponse> getTasks(UUID projectId, String status, UUID assigneeId, String search) {
        UUID tenantId = UserContext.getCurrentTenantId();
        TaskStatus ts = status != null ? TaskStatus.valueOf(status) : null;
        return taskRepository.findWithFilters(projectId, tenantId, ts, assigneeId, search)
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    public TaskResponse getTask(UUID taskId) {
        Task task = findTask(taskId);
        return toResponse(task);
    }

    @Transactional
    public TaskResponse updateTask(UUID taskId, UpdateTaskRequest request) {
        Task task = findTask(taskId);

        if (request.getTitle() != null) task.setTitle(request.getTitle());
        if (request.getDescription() != null) task.setDescription(request.getDescription());
        if (request.getStatus() != null) {
            TaskStatus newStatus = TaskStatus.valueOf(request.getStatus());
            if (task.getStatus() != newStatus && !isValidTransition(task.getStatus(), newStatus)) {
                throw new BadRequestException("Invalid status transition from " + task.getStatus() + " to " + newStatus);
            }
            task.setStatus(newStatus);
        }
        if (request.getPriority() != null) task.setPriority(TaskPriority.valueOf(request.getPriority()));
        if (request.getAssigneeId() != null) {
            task.setAssigneeId(request.getAssigneeId());
            task.setAssigneeName(request.getAssigneeName());
        }
        if (request.getDeadline() != null) task.setDeadline(request.getDeadline());
        if (request.getPosition() != null) task.setPosition(request.getPosition());
        if (request.getLabelIds() != null) {
            Set<TaskLabel> labels = new HashSet<>(labelRepository.findAllById(request.getLabelIds()));
            task.setLabels(labels);
        }

        return toResponse(taskRepository.save(task));
    }

    @Transactional
    public TaskResponse updateStatus(UUID taskId, String status) {
        Task task = findTask(taskId);
        TaskStatus newStatus = TaskStatus.valueOf(status);
        if (task.getStatus() != newStatus && !isValidTransition(task.getStatus(), newStatus)) {
            throw new BadRequestException("Invalid status transition from " + task.getStatus() + " to " + newStatus);
        }
        task.setStatus(newStatus);
        return toResponse(taskRepository.save(task));
    }

    @Transactional
    public void deleteTask(UUID taskId) {
        Task task = findTask(taskId);
        taskRepository.delete(task);
    }

    public Map<String, Long> getStats(UUID projectId) {
        Map<String, Long> stats = new HashMap<>();
        stats.put("total", taskRepository.countByProjectId(projectId));
        for (TaskStatus s : TaskStatus.values()) {
            stats.put(s.name(), taskRepository.countByProjectIdAndStatus(projectId, s));
        }
        return stats;
    }

    // Labels
    public List<TaskResponse.LabelResponse> getLabels(UUID projectId) {
        return labelRepository.findByProjectId(projectId).stream()
                .map(l -> TaskResponse.LabelResponse.builder()
                        .id(l.getId()).name(l.getName()).color(l.getColor()).build())
                .collect(Collectors.toList());
    }

    @Transactional
    public TaskResponse.LabelResponse createLabel(UUID projectId, String name, String color) {
        if (labelRepository.existsByProjectIdAndName(projectId, name)) {
            throw new BadRequestException("Label already exists: " + name);
        }
        TaskLabel label = labelRepository.save(TaskLabel.builder()
                .projectId(projectId).name(name).color(color).build());
        return TaskResponse.LabelResponse.builder()
                .id(label.getId()).name(label.getName()).color(label.getColor()).build();
    }

    @Transactional
    public void deleteLabel(UUID labelId) {
        labelRepository.deleteById(labelId);
    }

    private Task findTask(UUID taskId) {
        UUID tenantId = UserContext.getCurrentTenantId();
        return taskRepository.findByIdAndTenantId(taskId, tenantId)
                .orElseThrow(() -> new ResourceNotFoundException("Task", "id", taskId));
    }

    private boolean isValidTransition(TaskStatus from, TaskStatus to) {
        if (from == to) return true;
        return switch (from) {
            case BACKLOG, TODO -> to == TaskStatus.IN_PROGRESS;
            case IN_PROGRESS -> to == TaskStatus.IN_REVIEW || to == TaskStatus.RE_OPEN;
            case IN_REVIEW -> to == TaskStatus.DONE || to == TaskStatus.RE_OPEN;
            case DONE -> to == TaskStatus.RE_OPEN;
            case RE_OPEN -> to == TaskStatus.IN_PROGRESS || to == TaskStatus.IN_REVIEW;
        };
    }

    private TaskResponse toResponse(Task task) {
        List<TaskResponse.LabelResponse> labels = task.getLabels().stream()
                .map(l -> TaskResponse.LabelResponse.builder()
                        .id(l.getId()).name(l.getName()).color(l.getColor()).build())
                .collect(Collectors.toList());

        return TaskResponse.builder()
                .id(task.getId())
                .projectId(task.getProjectId())
                .title(task.getTitle())
                .description(task.getDescription())
                .status(task.getStatus().name())
                .priority(task.getPriority().name())
                .creatorId(task.getCreatorId())
                .creatorName(task.getCreatorName())
                .assigneeId(task.getAssigneeId())
                .assigneeName(task.getAssigneeName())
                .deadline(task.getDeadline())
                .position(task.getPosition())
                .labels(labels)
                .createdAt(task.getCreatedAt())
                .updatedAt(task.getUpdatedAt())
                .build();
    }
}
