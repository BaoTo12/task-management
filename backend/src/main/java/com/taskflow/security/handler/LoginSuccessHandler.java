package com.taskflow.security.handler;

import com.taskflow.security.AuthUser;
import com.taskflow.security.SessionKeys;
import com.taskflow.web.support.Flash;
import com.taskflow.web.support.Messages;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import org.springframework.security.core.Authentication;
import org.springframework.security.web.authentication.SavedRequestAwareAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

/**
 * After a successful FORM login (Spring Security has already changed the session id and stored the SecurityContext):
 * remember the login IP (for a later SESSION_EXPIRED audit event), say welcome, and 303 to the page the user wanted
 * before being sent to /login (the saved request), or /tasks.
 */
@Component
public class LoginSuccessHandler extends SavedRequestAwareAuthenticationSuccessHandler {

  private final Flash flash;
  private final Messages messages;

  public LoginSuccessHandler(Flash flash, Messages messages) {
    this.flash = flash;
    this.messages = messages;
    setDefaultTargetUrl("/tasks");
    setRedirectStrategy(new SeeOtherRedirectStrategy());
  }

  @Override
  public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response, Authentication authentication)
      throws ServletException, IOException {
    request.getSession().setAttribute(SessionKeys.LOGIN_IP, request.getRemoteAddr());
    AuthUser user = (AuthUser) authentication.getPrincipal();
    flash.message(request, response, messages.get(request, "flash.welcome", user.getDisplayName()));
    super.onAuthenticationSuccess(request, response, authentication);
  }
}
