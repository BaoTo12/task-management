package com.taskflow.controller.api;

import com.fasterxml.jackson.databind.JsonNode;
import com.taskflow.dto.request.LabelIdsRequest;
import com.taskflow.dto.request.TaskInput;
import com.taskflow.dto.response.PageDto;
import com.taskflow.dto.response.TaskDto;
import com.taskflow.entity.Priority;
import com.taskflow.entity.Task;
import com.taskflow.entity.TaskStatus;
import com.taskflow.exception.ApiException;
import com.taskflow.repository.criteria.TaskQuery;
import com.taskflow.repository.criteria.TaskSort;
import com.taskflow.security.AuthUser;
import com.taskflow.service.TaskService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import java.net.URI;
import java.util.LinkedHashMap;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

/**
 * The tasks resource. The SAME TaskService as the JSP controllers: same rules, same access checks; only the input
 * (JSON, query parameters) and the output (DTOs as JSON) differ.
 *
 *   GET    /api/tasks?q=&status=&priority=&categoryId=&projectId=&assigneeId=&labelId=&page=0&size=20&sort=dueDate,asc
 *   POST   /api/tasks                → 201 + Location + TaskDto
 *   GET    /api/tasks/{id}           → 200 TaskDto          (someone else's or missing → 404)
 *   PUT    /api/tasks/{id}           → 200 TaskDto          (all core fields)
 *   PATCH  /api/tasks/{id}           → 200 TaskDto          (the fields present)
 *   DELETE /api/tasks/{id}           → 204
 *   PUT    /api/tasks/{id}/labels    → 200 TaskDto          {"labelIds":[1,3]}
 *
 * @Validated is not needed for @Min/@Max on parameters: Spring 6.1's built-in METHOD validation applies them and
 * throws HandlerMethodValidationException (→ 400) when they fail.
 */
@RestController
@RequestMapping("/api/tasks")
@RequiredArgsConstructor
public class TaskApiController {

  private static final Map<String, TaskSort> SORT_FIELDS = Map.of(
      "id", TaskSort.ID, "title", TaskSort.TITLE, "priority", TaskSort.PRIORITY,
      "dueDate", TaskSort.DUE, "createdAt", TaskSort.CREATED, "updatedAt", TaskSort.UPDATED);

  private final TaskService service;

  @GetMapping
  PageDto<TaskDto> list(@RequestParam(required = false) String q,
                        @RequestParam(required = false) String status,
                        @RequestParam(required = false) String priority,
                        @RequestParam(required = false) @Min(1) Long categoryId,
                        @RequestParam(required = false) @Min(1) Long projectId,
                        @RequestParam(required = false) @Min(1) Long assigneeId,
                        @RequestParam(required = false) @Min(1) Long labelId,
                        @RequestParam(defaultValue = "0") @Min(0) int page,
                        @RequestParam(defaultValue = "20") @Min(1) @Max(100) int size,
                        @RequestParam(defaultValue = "id,asc") String sort,
                        @AuthenticationPrincipal AuthUser user) {
    Map<String, String> errors = new LinkedHashMap<>();
    TaskStatus statusFilter = status == null ? null : TaskStatus.parse(status);
    if (status != null && statusFilter == null) errors.put("status", "must be one of TODO, IN_PROGRESS, DONE");
    Priority priorityFilter = priority == null ? null : Priority.parse(priority);
    if (priority != null && priorityFilter == null) errors.put("priority", "must be one of LOW, MEDIUM, HIGH");
    String[] parts = sort.split(",", -1);
    String direction = parts.length > 1 ? parts[1] : "asc";
    TaskSort taskSort = SORT_FIELDS.get(parts[0]);
    if (taskSort == null || parts.length > 2 || !(direction.equals("asc") || direction.equals("desc"))) {
      errors.put("sort", "must be <field>,<asc|desc> with field one of id, title, priority, dueDate, createdAt, updatedAt");
    }
    if (!errors.isEmpty()) throw ApiException.validation(errors);

    boolean descending = direction.equals("desc");
    if (taskSort == TaskSort.PRIORITY) descending = !descending;   // TaskSort ranks HIGH first; the API's "asc" is LOW → HIGH
    TaskQuery query = new TaskQuery(statusFilter, priorityFilter, q == null || q.isBlank() ? null : q.strip(),
        categoryId, projectId, assigneeId, labelId, taskSort, descending);
    return PageDto.from(service.pageAt(query, page, size, user), TaskDto::from);
  }

  @PostMapping
  ResponseEntity<TaskDto> create(@RequestBody JsonNode body, @AuthenticationPrincipal AuthUser user) {
    TaskInput input = TaskInput.parse(body, false, service.categoryIds());
    if (!input.getErrors().isEmpty()) throw ApiException.validation(input.getErrors());
    Task task = new Task();
    input.applyTo(task);
    Task saved = service.create(task, user);                       // the owner comes from the session, never the body
    URI location = ServletUriComponentsBuilder.fromCurrentRequest().path("/{id}").buildAndExpand(saved.getId()).toUri();
    return ResponseEntity.created(location).body(TaskDto.from(saved));
  }

  @GetMapping("/{id}")
  TaskDto get(@PathVariable long id, @AuthenticationPrincipal AuthUser user) {
    return TaskDto.from(service.requireVisible(id, user));
  }

  @PutMapping("/{id}")
  TaskDto replace(@PathVariable long id, @RequestBody JsonNode body, @AuthenticationPrincipal AuthUser user) {
    return update(id, body, false, user);
  }

  @PatchMapping("/{id}")
  TaskDto patch(@PathVariable long id, @RequestBody JsonNode body, @AuthenticationPrincipal AuthUser user) {
    return update(id, body, true, user);
  }

  @DeleteMapping("/{id}")
  ResponseEntity<Void> delete(@PathVariable long id, @AuthenticationPrincipal AuthUser user) {
    if (!service.delete(id, user)) throw ApiException.notFound("Task not found");
    return ResponseEntity.noContent().build();                    // 204: no body at all
  }

  @PutMapping("/{id}/labels")
  TaskDto labels(@PathVariable long id, @Valid @RequestBody LabelIdsRequest body, @AuthenticationPrincipal AuthUser user) {
    return service.setLabels(id, user, body.labelIds()).map(TaskDto::from)
        .orElseThrow(() -> ApiException.notFound("Task not found"));
  }

  private TaskDto update(long id, JsonNode body, boolean partial, AuthUser user) {
    TaskInput input = TaskInput.parse(body, partial, service.categoryIds());
    if (!input.getErrors().isEmpty()) throw ApiException.validation(input.getErrors());
    return service.update(id, user, input::applyTo).map(TaskDto::from)   // a METHOD REFERENCE as the Consumer<Task>
        .orElseThrow(() -> ApiException.notFound("Task not found"));
  }
}
