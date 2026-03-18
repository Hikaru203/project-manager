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
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CommentService {

    private final CommentRepository commentRepository;

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
        return toResponse(commentRepository.save(comment));
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
        comment.setContent(content);
        return toResponse(commentRepository.save(comment));
    }

    @Transactional
    public void deleteComment(UUID commentId) {
        Comment comment = findComment(commentId);
        if (!comment.getAuthorId().equals(UserContext.getCurrentUserId())) {
            throw new ForbiddenException("You can only delete your own comments");
        }
        commentRepository.delete(comment);
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
