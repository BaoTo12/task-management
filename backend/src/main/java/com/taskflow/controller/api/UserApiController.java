package com.taskflow.controller.api;

import com.taskflow.dto.response.UserSummaryDto;
import com.taskflow.service.UserService;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * GET /api/users?q=ali        → at most 20 matching people (the assignee and member pickers)
 * GET /api/users?ids=1,4,5    → exactly these people (the SPA resolves ids it found in tasks and notifications)
 * Any logged-in user may look people up: a team tool needs a directory. It exposes names only, never emails.
 * Spring converts "1,4,5" into a List<Long> by itself.
 */
@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserApiController {

  private final UserService users;

  @GetMapping
  List<UserSummaryDto> find(@RequestParam(required = false) String q, @RequestParam(required = false) List<Long> ids) {
    if (ids != null && !ids.isEmpty()) return users.byIds(ids).stream().map(UserSummaryDto::from).toList();
    return users.search(q).stream().map(UserSummaryDto::from).toList();
  }
}
