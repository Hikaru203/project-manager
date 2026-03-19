package com.projectmanager.comment.service;

import com.projectmanager.comment.domain.Comment;
import com.projectmanager.comment.dto.*;
import com.projectmanager.comment.repository.CommentRepository;
import com.projectmanager.common.exception.*;
import com.projectmanager.common.security.UserContext;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CommentService {

    private final CommentRepository commentRepository;
    private final com.projectmanager.audit.service.AuditService auditService;

    @Transactional
    public CommentResponse createComment(CreateCommentRequest request) {
        Comment comment = Comment.builder()
                .taskId(request.getTaskId())
                .projectId(request.getProjectId())
                .tenantId(UserContext.getCurrentTenantId())
                .authorId(UserContext.getCurrentUserId())
                .authorName(UserContext.getCurrentUsername())
                .content(request.getContent())
                .build();
        comment = commentRepository.save(comment);
        
        auditService.createLog(com.projectmanager.audit.dto.CreateAuditLogRequest.builder()
                .action("CREATE_COMMENT")
                .entityType("COMMENT")
                .entityId(comment.getTaskId())
                .newValue(Map.of("content", comment.getContent()))
                .build());

        return toResponse(comment);
    }

    public List<CommentResponse> getCommentsByTask(UUID taskId) {
        return commentRepository.findByTaskIdOrderByCreatedAtAsc(taskId)
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Transactional
    public CommentResponse updateComment(UUID commentId, String content) {
        Comment comment = findComment(commentId);
        if (!comment.getAuthorId().equals(UserContext.getCurrentUserId())) {
            throw new ForbiddenException("You can only edit your own comments");
        }
        String oldContent = comment.getContent();
        comment.setContent(content);
        comment = commentRepository.save(comment);

        auditService.createLog(com.projectmanager.audit.dto.CreateAuditLogRequest.builder()
                .action("UPDATE_COMMENT")
                .entityType("COMMENT")
                .entityId(comment.getTaskId())
                .oldValue(Map.of("content", oldContent))
                .newValue(Map.of("content", comment.getContent()))
                .build());

        return toResponse(comment);
    }

    @Transactional
    public void deleteComment(UUID commentId) {
        Comment comment = findComment(commentId);
        if (!comment.getAuthorId().equals(UserContext.getCurrentUserId())) {
            throw new ForbiddenException("You can only delete your own comments");
        }
        commentRepository.delete(comment);
        
        auditService.createLog(com.projectmanager.audit.dto.CreateAuditLogRequest.builder()
                .action("DELETE_COMMENT")
                .entityType("COMMENT")
                .entityId(comment.getTaskId())
                .oldValue(Map.of("content", comment.getContent()))
                .build());
    }

    private Comment findComment(UUID commentId) {
        UUID tenantId = UserContext.getCurrentTenantId();
        return commentRepository.findByIdAndTenantId(commentId, tenantId)
                .orElseThrow(() -> new ResourceNotFoundException("Comment", "id", commentId));
    }

    private CommentResponse toResponse(Comment c) {
        return CommentResponse.builder()
                .id(c.getId()).taskId(c.getTaskId()).projectId(c.getProjectId())
                .authorId(c.getAuthorId()).authorName(c.getAuthorName())
                .content(c.getContent()).createdAt(c.getCreatedAt()).updatedAt(c.getUpdatedAt())
                .build();
    }
}
