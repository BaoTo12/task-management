package com.taskflow.security.handler;

import com.taskflow.security.LoginThrottledException;
import com.taskflow.web.support.Flash;
import com.taskflow.web.support.Messages;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.authentication.AuthenticationFailureHandler;
import org.springframework.stereotype.Component;

/**
 * After a failed FORM login: back to /login (303, Post/Redirect/Get) with ONE generic message, and the username the
 * user typed (never the password) so they don't retype it. Throttled: another message and a Retry-After header.
 */
@Component
@RequiredArgsConstructor
public class LoginFailureHandler implements AuthenticationFailureHandler {

  private final Flash flash;
  private final Messages messages;

  @Override
  public void onAuthenticationFailure(HttpServletRequest request, HttpServletResponse response, AuthenticationException e) {
    boolean throttled = e instanceof LoginThrottledException;
    if (throttled) response.setHeader("Retry-After", String.valueOf(((LoginThrottledException) e).retryAfterSeconds()));
    String username = request.getParameter("username");
    flash.put(request, response, Map.of(
        "error", messages.get(request, throttled ? "login.throttled" : "login.invalid"),
        "username", username == null ? "" : username));
    response.setStatus(HttpServletResponse.SC_SEE_OTHER);
    response.setHeader("Location", request.getContextPath() + "/login");
  }
}
