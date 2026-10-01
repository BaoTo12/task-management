package com.taskflow.controller.api;

import com.taskflow.dto.response.ActivityDto;
import com.taskflow.dto.response.CursorPageDto;
import com.taskflow.security.AuthUser;
import com.taskflow.service.ActivityService;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/** GET /api/activity?projectId=&taskId=&before=&limit=20 → the feed the caller may see, newest first, cursor-paged. */
@RestController
@RequiredArgsConstructor
public class ActivityApiController {

  private final ActivityService activity;

  @GetMapping("/api/activity")
  CursorPageDto<ActivityDto> feed(@RequestParam(required = false) @Min(1) Long projectId,
                                  @RequestParam(required = false) @Min(1) Long taskId,
                                  @RequestParam(required = false) @Min(1) Long before,
                                  @RequestParam(defaultValue = "20") @Min(1) @Max(50) int limit,
                                  @AuthenticationPrincipal AuthUser user) {
    return activity.feed(user, projectId, taskId, before, limit);
  }
}
