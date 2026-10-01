package com.taskflow.controller.web;

import com.taskflow.security.AuthUser;
import com.taskflow.security.handler.LoginFailureHandler;
import com.taskflow.security.handler.LoginSuccessHandler;
import com.taskflow.web.support.Messages;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;

/**
 * GET /login → the login form (auth/login.jsp). There is no POST handler here: Spring Security's
 * UsernamePasswordAuthenticationFilter answers POST /login itself (formLogin in SecurityConfig), BEFORE any controller,
 * then LoginSuccessHandler / LoginFailureHandler redirect. A failed attempt comes back here with flash attributes
 * ("error", "username"), which Spring has already put into the Model.
 */
@Controller
@RequiredArgsConstructor
public class LoginPageController {

  private final Messages messages;

  @GetMapping("/login")
  String login(@AuthenticationPrincipal AuthUser user, @RequestParam(required = false) String expired, Model model) {
    if (user != null) return "redirect:/tasks";                   // already logged in
    model.addAttribute("expired", expired != null);
    model.addAttribute("pageTitle", messages.get("page.login"));
    return "auth/login";
  }
}
