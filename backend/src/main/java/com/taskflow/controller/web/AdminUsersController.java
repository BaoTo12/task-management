package com.taskflow.controller.web;

import com.taskflow.service.UserAdminService.Change;
import com.taskflow.exception.BadRequestException;
import com.taskflow.exception.NotFoundException;
import com.taskflow.security.AuthUser;
import com.taskflow.service.UserAdminService;
import com.taskflow.web.support.Messages;
import jakarta.servlet.http.HttpServletRequest;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

/**
 * GET  /admin/users                   every account, with enable/disable and role forms
 * POST /admin/users/{enable|disable}  id
 * POST /admin/users/role              id, role (USER | ADMIN)
 * Admins only: the URL rule in SecurityConfig AND @PreAuthorize on UserAdminService. Every POST answers with PRG:
 * a flash message + 303 back to the list. Only the id and the role are read from the form (no mass assignment).
 */
@Controller
@RequestMapping("/admin/users")
@RequiredArgsConstructor
public class AdminUsersController {

  private final UserAdminService service;
  private final Messages messages;

  @GetMapping
  String list(Model model) {
    model.addAttribute("pageTitle", messages.get("page.users"));
    model.addAttribute("accounts", service.accounts());
    model.addAttribute("roles", List.of("USER", "ADMIN"));
    return "admin/users";
  }

  /** {action:enable|disable}: a path variable restricted by a regex; anything else isn't mapped (404). */
  @PostMapping("/{action:enable|disable}")
  String setEnabled(@PathVariable String action, @RequestParam long id, @AuthenticationPrincipal AuthUser admin,
                    HttpServletRequest request, RedirectAttributes redirect) {
    return done(service.setEnabled(admin, id, action.equals("enable"), request.getRemoteAddr()), redirect);
  }

  @PostMapping("/role")
  String changeRole(@RequestParam long id, @RequestParam String role, @AuthenticationPrincipal AuthUser admin,
                    HttpServletRequest request, RedirectAttributes redirect) {
    if (!UserAdminService.ROLES.contains(role)) throw new BadRequestException("Unknown role");
    return done(service.changeRole(admin, id, role, request.getRemoteAddr()), redirect);
  }

  private String done(Change change, RedirectAttributes redirect) {
    if (change == Change.NOT_FOUND) throw new NotFoundException();
    redirect.addFlashAttribute("flash", messages.get(change == Change.OWN_ACCOUNT ? "flash.user.own" : "flash.user.updated"));
    return "redirect:/admin/users";
  }
}
