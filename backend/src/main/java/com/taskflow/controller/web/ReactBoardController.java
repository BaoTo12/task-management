package com.taskflow.controller.web;

import com.taskflow.dto.response.CategoryDto;
import com.taskflow.dto.response.PageDto;
import com.taskflow.dto.response.TaskDto;
import com.taskflow.dto.response.UserDto;
import com.taskflow.repository.criteria.TaskQuery;
import com.taskflow.security.AuthUser;
import com.taskflow.service.AuthService;
import com.taskflow.service.TaskService;
import com.taskflow.web.support.IslandAssets;
import com.taskflow.web.support.Messages;
import com.taskflow.web.support.ScriptJson;
import java.util.LinkedHashMap;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;

/**
 * GET /react-board → a JSP page (layout, nav, i18n from the server) with a React Kanban board mounted inside it.
 * The controller prepares the INITIAL DATA the island needs for its first render, in the exact JSON shapes of the API
 * (the same DTOs), so React can seed its RTK Query cache instead of making three requests on load:
 *   {"user": UserDto, "tasks": PageDto<TaskDto> (the SPA's LIST_QUERY: size 100), "categories": [CategoryDto]}
 */
@Controller
@RequiredArgsConstructor
public class ReactBoardController {

  static final int LIST_SIZE = 100;          // the SPA's LIST_QUERY = { size: 100 }: the same cache entry

  private final TaskService tasks;
  private final AuthService auth;
  private final IslandAssets islands;
  private final ScriptJson scriptJson;
  private final Messages messages;

  @GetMapping("/react-board")
  String board(@AuthenticationPrincipal AuthUser user, Model model) {
    Map<String, Object> initial = new LinkedHashMap<>();
    initial.put("user", auth.profile(user.getId()).map(UserDto::from).orElseThrow());
    initial.put("tasks", PageDto.from(tasks.pageAt(TaskQuery.all(), 0, LIST_SIZE, user), TaskDto::from));
    initial.put("categories", tasks.categories().stream().map(CategoryDto::from).toList());
    model.addAttribute("pageTitle", messages.get("page.board"));
    model.addAttribute("initialJson", scriptJson.of(initial));
    model.addAttribute("island", islands.entry("src/island/boardIsland.tsx"));
    return "react-board";
  }
}
