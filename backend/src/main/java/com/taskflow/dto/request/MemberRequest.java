package com.taskflow.dto.request;

import com.taskflow.entity.ProjectRole;
import jakarta.validation.constraints.NotNull;

/** PUT /api/projects/{id}/members/{userId}: {"role":"MEMBER"}. Jackson refuses unknown enum names → 400 MALFORMED_JSON. */
public record MemberRequest(@NotNull ProjectRole role) {}
