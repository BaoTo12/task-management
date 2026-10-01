package com.taskflow.repository.criteria;

import com.taskflow.entity.Priority;
import com.taskflow.entity.TaskStatus;

/**
 * What a task list asks for. Every field is already PARSED and VALIDATED by the controller (an enum, a trimmed search
 * text or null, ids or null, a sort constant). Who may see which tasks is NOT here: TaskService adds that, from the
 * caller, so no request can widen it.
 */
public record TaskQuery(TaskStatus status, Priority priority, String text, Long categoryId, Long projectId,
                        Long assigneeId, Long labelId, TaskSort sort, boolean descending) {

  public TaskQuery {
    if (sort == null) sort = TaskSort.ID;
  }

  public static TaskQuery all() {
    return new TaskQuery(null, null, null, null, null, null, null, TaskSort.ID, false);
  }

  /** The JSP list's filters: status, search text, category, sort. */
  public static TaskQuery of(TaskStatus status, String text, Long categoryId, TaskSort sort, boolean descending) {
    return new TaskQuery(status, null, text, categoryId, null, null, null, sort, descending);
  }
}
