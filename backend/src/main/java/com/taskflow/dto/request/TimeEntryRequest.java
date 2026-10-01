package com.taskflow.dto.request;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.Instant;

/** POST /api/tasks/{id}/time-entries: time logged by hand. Instants as ISO-8601 ("2026-09-30T08:00:00Z"). */
public record TimeEntryRequest(
    @NotNull Instant startedAt,
    @NotNull Instant endedAt,
    @Size(max = 200) String note) {}
