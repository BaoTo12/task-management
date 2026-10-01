package com.taskflow.dto.response;

import java.util.Map;

/** GET /api/stats: {"total":22,"byStatus":{"TODO":…},"byPriority":{"LOW":…}} over the tasks the caller may see. */
public record StatsDto(long total, Map<String, Long> byStatus, Map<String, Long> byPriority) {}
