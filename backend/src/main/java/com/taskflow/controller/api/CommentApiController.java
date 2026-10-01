package com.taskflow.controller.api;

import com.taskflow.dto.request.CommentRequest;
import com.taskflow.dto.response.CommentDto;
import com.taskflow.entity.Comment;
import com.taskflow.security.AuthUser;
import com.taskflow.service.CommentService;
import jakarta.validation.Valid;
import java.net.URI;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

/**
 * GET  /api/tasks/{taskId}/comments  → 200 [CommentDto], oldest first
 * POST /api/tasks/{taskId}/comments  → 201 + Location + CommentDto
 * A SUB-RESOURCE: comments only exist inside a task, so the URL says so.
 */
@RestController
@RequestMapping("/api/tasks/{taskId}/comments")
@RequiredArgsConstructor
public class CommentApiController {

  private final CommentService comments;

  @GetMapping
  List<CommentDto> list(@PathVariable long taskId, @AuthenticationPrincipal AuthUser user) {
    return comments.forTask(taskId, user).stream().map(details -> CommentDto.from(details.getComment())).toList();
  }

  @PostMapping
  ResponseEntity<CommentDto> add(@PathVariable long taskId, @Valid @RequestBody CommentRequest body,
                                 @AuthenticationPrincipal AuthUser user) {
    Comment saved = comments.add(taskId, user, body.body().strip());
    URI location = ServletUriComponentsBuilder.fromCurrentRequest().path("/{id}").buildAndExpand(saved.getId()).toUri();
    return ResponseEntity.created(location).body(CommentDto.from(saved));
  }
}
