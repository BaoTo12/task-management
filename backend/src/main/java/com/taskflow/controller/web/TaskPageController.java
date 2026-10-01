package com.taskflow.controller.web;

import com.taskflow.dto.response.UserDto;
import com.taskflow.dto.view.PageView;
import com.taskflow.dto.view.TaskDetails;
import com.taskflow.entity.Comment;
import com.taskflow.entity.Task;
import com.taskflow.entity.TaskStatus;
import com.taskflow.exception.BadRequestException;
import com.taskflow.exception.NotFoundException;
import com.taskflow.repository.criteria.TaskQuery;
import com.taskflow.repository.criteria.TaskSort;
import com.taskflow.security.AuthUser;
import com.taskflow.service.AuthService;
import com.taskflow.service.CommentService;
import com.taskflow.service.TaskService;
import com.taskflow.web.listener.AppStats;
import com.taskflow.web.support.IslandAssets;
import com.taskflow.web.support.Messages;
import com.taskflow.web.support.Params;
import com.taskflow.web.support.RecentTasks;
import com.taskflow.web.support.ScriptJson;
import java.util.Map;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

/**
 * The task pages of the Admin Portal. A thin CONTROLLER: parse the request into typed values, ask the SERVICE, put the
 * results in the MODEL, return a VIEW NAME (→ /WEB-INF/views/<name>.jsp). No queries and no HTML here.
 *
 *   GET  /tasks[?status=DONE][&q=text][&category=2][&sort=due][&dir=desc][&page=2]   the list
 *   GET  /tasks/view?id=N        one task
 *   GET  /tasks/latest           FORWARD to the newest task (one request; the URL bar keeps /tasks/latest)
 *   POST /tasks/toggle  (id)     DONE ↔ TODO, then 303 → the list (Post/Redirect/Get)
 *   POST /tasks/delete  (id)
 *   POST /tasks/comment (id, body)
 * The form pages (new, edit) are TaskFormController; CSV export/import TaskCsvController.
 */
@Controller
@RequestMapping("/tasks")
@RequiredArgsConstructor
public class TaskPageController {

  private final TaskService tasks;
  private final CommentService comments;
  private final AuthService auth;
  private final RecentTasks recentTasks;          // a SESSION-scoped bean behind a proxy
  private final AppStats stats;
  private final IslandAssets islands;
  private final ScriptJson scriptJson;
  private final Messages messages;

  /** Optional filters are parsed LENIENTLY (?category=abc → no filter), not rejected: it's a page, not an API. */
  @GetMapping
  String list(@RequestParam(required = false) String status, @RequestParam(required = false) String q,
              @RequestParam(required = false) String category, @RequestParam(required = false) String sort,
              @RequestParam(required = false) String dir, @RequestParam(required = false) String page,
              @AuthenticationPrincipal AuthUser user, Model model) {
    TaskQuery query = TaskQuery.of(TaskStatus.parse(status), Params.text(q), Params.positiveId(category),
        TaskSort.parse(sort), "desc".equals(dir));
    Long requestedPage = Params.positiveId(page);
    PageView<Task> taskPage = tasks.page(query, requestedPage == null ? 1 : requestedPage.intValue(), user);

    model.addAttribute("pageTitle", messages.get("page.tasks"));
    model.addAttribute("taskPage", taskPage);
    model.addAttribute("tasks", taskPage.getItems());
    model.addAttribute("statusFilter", query.status());
    model.addAttribute("categoryFilter", query.categoryId());
    model.addAttribute("sort", query.sort());
    model.addAttribute("descending", query.descending());
    model.addAttribute("today", tasks.today());
    model.addAttribute("overdueCount", tasks.overdue(user).size());
    model.addAttribute("stats", tasks.countByStatus(user));
    model.addAttribute("statuses", TaskStatus.values());
    model.addAttribute("categories", tasks.categories());
    model.addAttribute("sorts", TaskSort.values());
    model.addAttribute("recentTasks", recentTasks.ids().stream()           // deleted (or no longer visible) ones drop out
        .map(id -> visibleOrEmpty(id, user)).flatMap(Optional::stream).toList());
    return "tasks/list";
  }

  @GetMapping("/view")
  String view(@RequestParam long id, @AuthenticationPrincipal AuthUser user, Model model) {
    TaskDetails details = tasks.details(id, user).orElseThrow(NotFoundException::new);
    recentTasks.record(id);
    stats.taskViewed(id);
    model.addAttribute("details", details);
    model.addAttribute("pageTitle", details.getTask().getTitle());          // header.jspf escapes it
    model.addAttribute("today", tasks.today());
    // The React comments island, if built: its entry files and its initial data (who is logged in).
    IslandAssets.Entry island = islands.entry("src/island/commentsIsland.tsx");
    if (island != null) {
      model.addAttribute("commentsIsland", island);
      model.addAttribute("commentsInitialJson", scriptJson.of(Map.of("user",
          auth.profile(user.getId()).map(UserDto::from).orElseThrow())));
    }
    return "tasks/view";
  }

  @GetMapping("/latest")
  String latest(@AuthenticationPrincipal AuthUser user) {
    long newest = tasks.latestId(user).orElseThrow(NotFoundException::new);
    return "forward:/tasks/view?id=" + newest;                              // server-internal: no second request
  }

  @PostMapping("/toggle")
  String toggle(@RequestParam long id, @AuthenticationPrincipal AuthUser user, RedirectAttributes redirect) {
    tasks.toggle(id, user).orElseThrow(NotFoundException::new);
    redirect.addFlashAttribute("flash", messages.get("flash.task.toggled"));
    return "redirect:/tasks";
  }

  @PostMapping("/delete")
  String delete(@RequestParam long id, @AuthenticationPrincipal AuthUser user, RedirectAttributes redirect) {
    if (!tasks.delete(id, user)) throw new NotFoundException();
    redirect.addFlashAttribute("flash", messages.get("flash.task.deleted"));
    return "redirect:/tasks";
  }

  /** HTML in the body is allowed and stored as is: safety comes from escaping at render time. */
  @PostMapping("/comment")
  String comment(@RequestParam long id, @RequestParam(defaultValue = "") String body,
                 @AuthenticationPrincipal AuthUser user, RedirectAttributes redirect) {
    String text = body.strip();
    if (text.isEmpty() || text.length() > Comment.MAX_BODY_LENGTH) {
      throw new BadRequestException("A comment needs 1 to " + Comment.MAX_BODY_LENGTH + " characters.");
    }
    comments.add(id, user, text);
    redirect.addFlashAttribute("flash", messages.get("flash.comment.added"));
    return "redirect:/tasks/view?id=" + id + "#comments";
  }

  private Optional<Task> visibleOrEmpty(long id, AuthUser user) {
    try {
      return tasks.task(id, user);
    } catch (RuntimeException noLongerVisible) {     // e.g. removed from the project since it was viewed
      return Optional.empty();
    }
  }
}
