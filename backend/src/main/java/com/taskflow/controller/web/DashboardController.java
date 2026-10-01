package com.taskflow.controller.web;

import com.taskflow.security.AuthUser;
import com.taskflow.service.TaskService;
import com.taskflow.web.support.Messages;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;

/** GET /dashboard → overdue tasks, tasks due within 7 days, counts and the completion rate. */
@Controller
@RequiredArgsConstructor
public class DashboardController {

  private final TaskService tasks;
  private final Messages messages;

  @GetMapping("/dashboard")
  String dashboard(@AuthenticationPrincipal AuthUser user, Model model) {
    Map<String, Long> counts = tasks.countByStatus(user);
    long total = counts.values().stream().mapToLong(Long::longValue).sum();
    model.addAttribute("pageTitle", messages.get("page.dashboard"));
    model.addAttribute("today", tasks.today());
    model.addAttribute("overdue", tasks.overdue(user));
    model.addAttribute("dueSoon", tasks.dueWithin(7, user));
    model.addAttribute("counts", counts);
    // A FRACTION: the VIEW formats it for the locale (fmt:formatNumber type="percent"). Controllers pass numbers.
    model.addAttribute("completion", total == 0 ? 0.0 : counts.getOrDefault("DONE", 0L) / (double) total);
    return "dashboard";
  }
}
