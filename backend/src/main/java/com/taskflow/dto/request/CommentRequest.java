package com.taskflow.dto.request;

import com.taskflow.entity.Comment;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/** POST /api/tasks/{id}/comments. @Valid in the controller checks it; failures → 400 VALIDATION_FAILED + fieldErrors. */
public record CommentRequest(
    @NotBlank @Size(max = Comment.MAX_BODY_LENGTH) String body) {}
