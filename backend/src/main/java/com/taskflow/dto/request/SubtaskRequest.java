package com.taskflow.dto.request;

import com.taskflow.entity.Subtask;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/** POST /api/tasks/{id}/subtasks. */
public record SubtaskRequest(@NotBlank @Size(max = Subtask.TITLE_MAX) String title) {}
