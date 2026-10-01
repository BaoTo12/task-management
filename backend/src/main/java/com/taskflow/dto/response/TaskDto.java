package com.taskflow.dto.response;

import com.taskflow.entity.Priority;
import com.taskflow.entity.Task;
import com.taskflow.entity.TaskStatus;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

/**
 * A task in the API contract (frontend: shared/domain/types.ts). Built from the entity by hand: an entity is never
 * serialised directly (a field added to it later would appear in every response without anyone deciding so).
 */
public record TaskDto(long id, String title, String description, TaskStatus status, Priority priority, LocalDate dueDate,
                      Long categoryId, Long projectId, long ownerId, Long assigneeId, List<Long> labelIds,
                      Instant createdAt, Instant updatedAt, Instant completedAt) {

  public static TaskDto from(Task t) {
    return new TaskDto(t.getId(), t.getTitle(), t.getDescription(), t.getStatus(), t.getPriority(), t.getDueDate(),
        t.getCategoryId(), t.getProjectId(), t.getOwnerId(), t.getAssigneeId(), List.copyOf(t.getLabelIds()),
        t.getCreatedAt(), t.getUpdatedAt(), t.getCompletedAt());
  }
}
