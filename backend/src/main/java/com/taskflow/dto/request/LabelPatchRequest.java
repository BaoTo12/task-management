package com.taskflow.dto.request;

import com.taskflow.entity.Label;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/** PATCH /api/labels/{id}: null = unchanged. */
public record LabelPatchRequest(
    @Size(min = 1, max = Label.NAME_MAX) String name,
    @Pattern(regexp = "#[0-9a-fA-F]{6}", message = "must look like #2563eb") String color) {}
