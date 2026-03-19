package com.projectmanager.task.repository;

import com.projectmanager.task.domain.Task;
import com.projectmanager.task.domain.TaskStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface TaskRepository extends JpaRepository<Task, UUID> {

    List<Task> findByProjectIdAndTenantIdOrderByPositionAsc(UUID projectId, UUID tenantId);

    List<Task> findByProjectIdAndStatusOrderByPositionAsc(UUID projectId, TaskStatus status);

    Optional<Task> findByIdAndTenantId(UUID id, UUID tenantId);

    @Query("SELECT t FROM Task t WHERE t.projectId = :projectId AND t.tenantId = :tenantId " +
           "AND (cast(:status as string) IS NULL OR t.status = :status) " +
           "AND (cast(:assigneeId as uuid) IS NULL OR :assigneeId MEMBER OF t.assigneeIds) " +
           "AND (cast(:search as string) IS NULL OR LOWER(t.title) LIKE LOWER(CONCAT('%', cast(:search as string), '%')))")
    List<Task> findWithFilters(@Param("projectId") UUID projectId,
                               @Param("tenantId") UUID tenantId,
                               @Param("status") TaskStatus status,
                               @Param("assigneeId") UUID assigneeId,
                               @Param("search") String search);

    long countByProjectIdAndStatus(UUID projectId, TaskStatus status);

    long countByProjectId(UUID projectId);

    @Query("SELECT MAX(t.position) FROM Task t WHERE t.projectId = :projectId AND t.status = :status")
    Integer findMaxPositionByProjectAndStatus(@Param("projectId") UUID projectId, @Param("status") TaskStatus status);
}
