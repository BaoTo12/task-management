package com.taskflow.dto.request;

import com.fasterxml.jackson.databind.JsonNode;
import com.taskflow.entity.Priority;
import com.taskflow.entity.Task;
import com.taskflow.entity.TaskStatus;
import com.taskflow.exception.ApiException;
import java.time.LocalDate;
import java.time.format.DateTimeParseException;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Set;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.RequiredArgsConstructor;

/**
 * The REQUEST side of a task: the fields a client may set, validated with the contract's messages.
 * Read from a JsonNode (not bound to a record) because PATCH must tell "absent" from null: "dueDate": null CLEARS the
 * date, a missing dueDate leaves it alone. Bean Validation on a record can't see that difference.
 *   POST, PUT  (partial = false): the six core fields are checked, absent ones included (title/status/priority required)
 *   PATCH      (partial = true):  only the fields PRESENT in the body
 *   projectId, assigneeId: always "only when present" (an older client that doesn't know them can't clear them)
 * Anything else in the body (id, ownerId, createdAt, role…) is never read: mass assignment has nowhere to land.
 * The SHAPE is checked here; whether the project and the assignee are allowed is TaskService's job (checkPlacement).
 */
@RequiredArgsConstructor(access = AccessLevel.PRIVATE)
public final class TaskInput {

  public static final int TITLE_MAX = 120;
  public static final int DESCRIPTION_MAX = 2000;

  @Getter
  private final Map<String, String> errors = new LinkedHashMap<>();
  private final JsonNode body;
  private final boolean partial;
  private String title;
  private String description;
  private TaskStatus status;
  private Priority priority;
  private LocalDate dueDate;
  private Long categoryId;
  private Long projectId;
  private Long assigneeId;

  public static TaskInput parse(JsonNode body, boolean partial, Set<Long> categoryIds) {
    if (body == null || !body.isObject()) throw ApiException.badRequest("The request body must be a JSON object");
    TaskInput input = new TaskInput(body, partial);
    input.validate(categoryIds);
    return input;
  }

  /** Copies the validated fields that were checked onto the task. Call only when errors() is empty. */
  public void applyTo(Task task) {
    if (checks("title")) task.setTitle(title);
    if (checks("description")) task.setDescription(description);
    if (checks("status")) task.setStatus(status);
    if (checks("priority")) task.setPriority(priority);
    if (checks("dueDate")) task.setDueDate(dueDate);
    if (checks("categoryId")) task.setCategoryId(categoryId);
    if (body.has("projectId")) task.setProjectId(projectId);
    if (body.has("assigneeId")) task.setAssigneeId(assigneeId);
  }

  private boolean checks(String field) {
    return !partial || body.has(field);
  }

  private void validate(Set<Long> categoryIds) {
    if (checks("title")) {
      String value = text(body.get("title"));
      value = value == null ? "" : value.strip();
      if (value.isEmpty()) errors.put("title", "must not be blank");
      else if (value.length() > TITLE_MAX) errors.put("title", "size must be at most " + TITLE_MAX);
      else title = value;
    }
    if (checks("description")) {
      JsonNode node = body.get("description");
      if (node == null || node.isNull()) description = "";
      else if (!node.isTextual()) errors.put("description", "must be a string");
      else if (node.asText().length() > DESCRIPTION_MAX) errors.put("description", "size must be at most " + DESCRIPTION_MAX);
      else description = node.asText().strip();
    }
    if (checks("status")) {
      status = TaskStatus.parse(text(body.get("status")));
      if (status == null) errors.put("status", "must be one of TODO, IN_PROGRESS, DONE");
    }
    if (checks("priority")) {
      priority = Priority.parse(text(body.get("priority")));
      if (priority == null) errors.put("priority", "must be one of LOW, MEDIUM, HIGH");
    }
    if (checks("dueDate")) {
      JsonNode node = body.get("dueDate");
      if (node != null && !node.isNull()) {
        try {
          if (!node.isTextual() || !node.asText().matches("\\d{4}-\\d{2}-\\d{2}")) throw new DateTimeParseException("", "", 0);
          dueDate = LocalDate.parse(node.asText());
        } catch (DateTimeParseException e) {
          errors.put("dueDate", "must be null or YYYY-MM-DD");
        }
      }
    }
    if (checks("categoryId")) {
      categoryId = optionalId("categoryId");
      if (categoryId != null && !categoryIds.contains(categoryId)) errors.put("categoryId", "unknown category");
    }
    if (body.has("projectId")) projectId = optionalId("projectId");
    if (body.has("assigneeId")) assigneeId = optionalId("assigneeId");
  }

  /** null or a positive integer; anything else is an error for that field. */
  private Long optionalId(String field) {
    JsonNode node = body.get(field);
    if (node == null || node.isNull()) return null;
    if (node.canConvertToExactIntegral() && node.asLong() > 0) return node.asLong();
    errors.put(field, "must be null or a positive integer");
    return null;
  }

  private static String text(JsonNode node) {
    return node != null && node.isTextual() ? node.asText() : null;
  }
}
