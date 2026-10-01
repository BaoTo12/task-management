package com.taskflow.controller.web;

import com.taskflow.dto.response.ReportSummaryDto;
import com.taskflow.dto.view.ProjectSummary;
import com.taskflow.entity.User;
import com.taskflow.security.AuthUser;
import com.taskflow.service.ProjectService;
import com.taskflow.service.ReportService;
import com.taskflow.service.UserService;
import com.taskflow.web.support.IslandAssets;
import com.taskflow.web.support.Messages;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;

/**
 * GET /admin/reports[?from=&to=&projectId=]: the SAME ReportService as GET /api/reports/summary, rendered as tables.
 * One service, two clients: the React Reports screen (charts) and this server-rendered page (admins, printable).
 */
@Controller
@RequiredArgsConstructor
public class ReportPageController {

  private final ReportService reports;
  private final ProjectService projects;
  private final UserService users;
  private final IslandAssets islands;
  private final Messages messages;

  @GetMapping("/admin/reports")
  String reports(@RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
                 @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
                 @RequestParam(required = false) Long projectId,
                 @AuthenticationPrincipal AuthUser user, Model model) {
    ReportSummaryDto report = reports.summary(user, from, to, projectId);
    List<ProjectSummary> projectList = projects.list(user);
    // id → name maps, so the view can print names: ${projectNames[row.projectId]}
    Map<Long, String> projectNames = projectList.stream()
        .collect(Collectors.toMap(p -> p.project().getId(), p -> p.project().getName()));
    Map<Long, String> userNames = users.enabledUsers().stream()
        .collect(Collectors.toMap(User::getId, User::getDisplayName));
    model.addAttribute("pageTitle", messages.get("page.reports"));
    model.addAttribute("report", report);
    model.addAttribute("projects", projectList.stream().map(ProjectSummary::project).toList());
    model.addAttribute("projectNames", projectNames);
    model.addAttribute("userNames", userNames);
    model.addAttribute("maxPerDay", report.getCompletedPerDay().stream()
        .mapToLong(ReportSummaryDto.DayCount::getCount).max().orElse(0));
    // The React version of the same report (the legacy classic-Redux module), if the islands are built.
    model.addAttribute("reportsIsland", islands.entry("src/island/reportsIsland.tsx"));
    return "admin/reports";
  }
}
