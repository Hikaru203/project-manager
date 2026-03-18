package com.projectmanager.comment.repository;

import com.projectmanager.comment.domain.Comment;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface CommentRepository extends JpaRepository<Comment, UUID> {
    List<Comment> findByTaskIdOrderByCreatedAtAsc(UUID taskId);
    Optional<Comment> findByIdAndTenantId(UUID id, UUID tenantId);
    long countByTaskId(UUID taskId);
}
