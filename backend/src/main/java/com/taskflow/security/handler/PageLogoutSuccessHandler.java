package com.taskflow.security.handler;

import com.taskflow.web.support.Flash;
import com.taskflow.web.support.Messages;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.web.authentication.logout.LogoutSuccessHandler;
import org.springframework.stereotype.Component;

/** After POST /logout from a page: the old session is gone; a NEW one carries "You have been logged out." → 303 /login. */
@Component
@RequiredArgsConstructor
public class PageLogoutSuccessHandler implements LogoutSuccessHandler {

  private final Flash flash;
  private final Messages messages;

  @Override
  public void onLogoutSuccess(HttpServletRequest request, HttpServletResponse response, Authentication authentication) {
    flash.message(request, response, messages.get(request, "flash.loggedOut"));
    response.setStatus(HttpServletResponse.SC_SEE_OTHER);
    response.setHeader("Location", request.getContextPath() + "/login");
  }
}
