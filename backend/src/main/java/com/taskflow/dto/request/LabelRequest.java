package com.taskflow.dto.request;

import com.taskflow.entity.Label;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/** POST /api/labels. */
public record LabelRequest(
    @NotBlank @Size(max = Label.NAME_MAX) String name,
    @NotNull @Pattern(regexp = "#[0-9a-fA-F]{6}", message = "must look like #2563eb") String color) {}
