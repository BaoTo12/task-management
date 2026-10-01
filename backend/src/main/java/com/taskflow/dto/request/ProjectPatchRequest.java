package com.taskflow.dto.request;

import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/** PATCH /api/projects/{id}: every field optional; null = unchanged. (Bean Validation skips null values.) */
public record ProjectPatchRequest(
    @Size(min = 1, max = 80) String name,
    @Size(max = 1000) String description,
    @Pattern(regexp = "#[0-9a-fA-F]{6}", message = "must look like #2563eb") String color,
    Boolean archived) {}
