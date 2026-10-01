package com.taskflow.controller.api;

import com.taskflow.dto.response.StatsDto;
import com.taskflow.security.AuthUser;
import com.taskflow.service.TaskService;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

/** GET /api/stats → counts per status and priority over the tasks the caller may see (all of them for an admin). */
@RestController
@RequiredArgsConstructor
public class StatsApiController {

  private final TaskService service;

  @GetMapping("/api/stats")
  StatsDto stats(@AuthenticationPrincipal AuthUser user) {
    Map<String, Long> byStatus = service.countByStatus(user);
    long total = byStatus.values().stream().mapToLong(Long::longValue).sum();
    return new StatsDto(total, byStatus, service.countByPriority(user));
  }
}
