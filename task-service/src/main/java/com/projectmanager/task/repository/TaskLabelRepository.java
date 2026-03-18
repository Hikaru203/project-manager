package com.projectmanager.task.repository;

import com.projectmanager.task.domain.TaskLabel;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface TaskLabelRepository extends JpaRepository<TaskLabel, UUID> {
    List<TaskLabel> findByProjectId(UUID projectId);
    boolean existsByProjectIdAndName(UUID projectId, String name);
}
