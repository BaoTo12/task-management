package com.taskflow.controller.web;

import com.taskflow.service.AuditService;
import com.taskflow.web.listener.AppStats;
import com.taskflow.web.listener.SessionRegistry;
import com.taskflow.web.support.Messages;
import com.taskflow.web.support.Params;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;

/**
 * GET /admin/audit[?type=LOGIN_FAIL][&user=bob][&page=2]: the audit log, newest first, 25 per page; plus who is logged in
 * right now (SessionRegistry, a servlet listener) and the session counter (AppStats). The type is allow-listed by the
 * service; the username is only ever a query PARAMETER.
 */
@Controller
@RequiredArgsConstructor
public class AdminAuditController {

  private final AuditService audit;
  private final SessionRegistry sessions;
  private final AppStats stats;
  private final Messages messages;

  @GetMapping("/admin/audit")
  String audit(@RequestParam(required = false) String type, @RequestParam(required = false) String user,
               @RequestParam(required = false) String page, Model model) {
    String username = Params.text(user);
    if (username != null && username.length() > 50) username = username.substring(0, 50);
    Long number = Params.positiveId(page);
    model.addAttribute("pageTitle", messages.get("page.audit"));
    model.addAttribute("auditPage", audit.page(type, username, number == null ? 1 : number.intValue()));
    model.addAttribute("types", AuditService.TYPES);
    model.addAttribute("typeFilter", type != null && AuditService.TYPES.contains(type) ? type : null);
    model.addAttribute("loggedInUsers", sessions.loggedInUsers());
    model.addAttribute("loggedInSessions", sessions.loggedInSessions());
    model.addAttribute("activeSessions", stats.getActiveSessions());
    return "admin/audit";
  }
}
