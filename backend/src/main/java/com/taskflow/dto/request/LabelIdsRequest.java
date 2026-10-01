package com.taskflow.dto.request;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.Set;

/** PUT /api/tasks/{id}/labels: the task's complete new set of labels. */
public record LabelIdsRequest(@NotNull @Size(max = 20) Set<Long> labelIds) {}
