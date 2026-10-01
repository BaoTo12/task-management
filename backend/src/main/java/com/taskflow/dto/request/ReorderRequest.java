package com.taskflow.dto.request;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.List;

/** PUT /api/tasks/{id}/subtasks/order: every subtask id of the task, in the new order. */
public record ReorderRequest(@NotNull @Size(max = 200) List<Long> ids) {}
