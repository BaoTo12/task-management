package com.taskflow.dto.request;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/** POST /api/auth/login body. Bean Validation checks the SHAPE; AuthService checks the credentials. */
public record LoginRequest(
    @NotNull @Size(max = 50) String username,
    @NotNull @Size(max = 200) String password) {}
