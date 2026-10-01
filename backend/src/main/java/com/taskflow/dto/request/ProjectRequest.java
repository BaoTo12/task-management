package com.taskflow.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/** POST /api/projects. */
public record ProjectRequest(
    @NotBlank @Size(max = 80) String name,
    @Size(max = 1000) String description,
    @Pattern(regexp = "#[0-9a-fA-F]{6}", message = "must look like #2563eb") String color) {

  /** Defaults for the optional fields: a COMPACT CONSTRUCTOR runs before the record's fields are assigned. */
  public ProjectRequest {
    description = description == null ? "" : description.strip();
    color = color == null ? "#2563eb" : color;
    name = name == null ? null : name.strip();
  }
}
