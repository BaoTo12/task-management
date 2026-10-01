package com.taskflow.controller.api;

import com.taskflow.dto.request.ReorderRequest;
import com.taskflow.dto.request.SubtaskPatchRequest;
import com.taskflow.dto.request.SubtaskRequest;
import com.taskflow.dto.response.SubtaskDto;
import com.taskflow.security.AuthUser;
import com.taskflow.service.SubtaskService;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

/**
 *   GET    /api/tasks/{taskId}/subtasks         → [SubtaskDto] in checklist order
 *   POST   /api/tasks/{taskId}/subtasks         → 201 SubtaskDto (appended at the end)
 *   PUT    /api/tasks/{taskId}/subtasks/order   → [SubtaskDto] {"ids":[…]} the new order
 *   PATCH  /api/subtasks/{id}                   → SubtaskDto  {"done":true} / {"title":"…"}
 *   DELETE /api/subtasks/{id}                   → 204
 * Once created, a subtask has its own URL: no need to repeat the task id to change it.
 */
@RestController
@RequiredArgsConstructor
public class SubtaskApiController {

  private final SubtaskService subtasks;

  @GetMapping("/api/tasks/{taskId}/subtasks")
  List<SubtaskDto> list(@PathVariable long taskId, @AuthenticationPrincipal AuthUser user) {
    return subtasks.list(taskId, user).stream().map(SubtaskDto::from).toList();
  }

  @PostMapping("/api/tasks/{taskId}/subtasks")
  @ResponseStatus(HttpStatus.CREATED)
  SubtaskDto add(@PathVariable long taskId, @Valid @RequestBody SubtaskRequest body, @AuthenticationPrincipal AuthUser user) {
    return SubtaskDto.from(subtasks.add(taskId, user, body.title().strip()));
  }

  @PutMapping("/api/tasks/{taskId}/subtasks/order")
  List<SubtaskDto> reorder(@PathVariable long taskId, @Valid @RequestBody ReorderRequest body,
                           @AuthenticationPrincipal AuthUser user) {
    return subtasks.reorder(taskId, user, body.ids()).stream().map(SubtaskDto::from).toList();
  }

  @PatchMapping("/api/subtasks/{id}")
  SubtaskDto update(@PathVariable long id, @Valid @RequestBody SubtaskPatchRequest body, @AuthenticationPrincipal AuthUser user) {
    String title = body.title() == null ? null : body.title().strip();
    return SubtaskDto.from(subtasks.update(id, user, new SubtaskService.Patch(title, body.done())));
  }

  @DeleteMapping("/api/subtasks/{id}")
  ResponseEntity<Void> delete(@PathVariable long id, @AuthenticationPrincipal AuthUser user) {
    subtasks.delete(id, user);
    return ResponseEntity.noContent().build();
  }
}
