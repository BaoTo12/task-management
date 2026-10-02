package com.taskflow.dto.response;

import com.taskflow.entity.Priority;
import com.taskflow.entity.Task;
import com.taskflow.entity.TaskStatus;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;


public record TaskDto(long id, String title, String description, TaskStatus status, Priority priority, LocalDate dueDate,
                      Long categoryId, Long projectId, long ownerId, Long assigneeId, List<Long> labelIds,
                      Instant createdAt, Instant updatedAt, Instant completedAt) {

  public static TaskDto from(Task t) {
    return new TaskDto(t.getId(), t.getTitle(), t.getDescription(), t.getStatus(), t.getPriority(), t.getDueDate(),
        t.getCategoryId(), t.getProjectId(), t.getOwnerId(), t.getAssigneeId(), List.copyOf(t.getLabelIds()),
        t.getCreatedAt(), t.getUpdatedAt(), t.getCompletedAt());
  }
}
