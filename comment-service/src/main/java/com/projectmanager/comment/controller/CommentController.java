package com.projectmanager.comment.controller;

import com.projectmanager.comment.dto.*;
import com.projectmanager.comment.service.CommentService;
import com.projectmanager.common.dto.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/comments")
@RequiredArgsConstructor
public class CommentController {

    private final CommentService commentService;

    @PostMapping
    public ResponseEntity<ApiResponse<CommentResponse>> create(@Valid @RequestBody CreateCommentRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(commentService.createComment(request)));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<CommentResponse>>> list(@RequestParam UUID taskId) {
        return ResponseEntity.ok(ApiResponse.success(commentService.getCommentsByTask(taskId)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<CommentResponse>> update(@PathVariable UUID id,
                                                                @RequestBody Map<String, String> body) {
        return ResponseEntity.ok(ApiResponse.success(commentService.updateComment(id, body.get("content"))));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID id) {
        commentService.deleteComment(id);
        return ResponseEntity.ok(ApiResponse.success(null, "Comment deleted"));
    }
}
