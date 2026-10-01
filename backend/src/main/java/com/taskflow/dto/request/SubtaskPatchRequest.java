package com.taskflow.dto.request;

import com.taskflow.entity.Subtask;
import jakarta.validation.constraints.Size;

/** PATCH /api/subtasks/{id}: {"done":true} and/or {"title":"…"}. */
public record SubtaskPatchRequest(@Size(min = 1, max = Subtask.TITLE_MAX) String title, Boolean done) {}
