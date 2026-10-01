package com.taskflow.security.handler;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.authentication.LoginUrlAuthenticationEntryPoint;

/**
 * An anonymous visitor on a protected PAGE → redirect to /login. Before that, Spring Security's RequestCache saves the
 * request, and LoginSuccessHandler sends the user back to it after logging in (the servlet era's ?returnUrl=…, without
 * an open-redirect risk: the target never comes from a parameter).
 * One addition: "?expired=1" when the browser sent a session id the server no longer knows (it timed out), so the login
 * page can say so.
 */
public class LoginEntryPoint extends LoginUrlAuthenticationEntryPoint {

  public LoginEntryPoint(String loginFormUrl) {
    super(loginFormUrl);
  }

  @Override
  protected String determineUrlToUseForThisRequest(HttpServletRequest request, HttpServletResponse response,
                                                   AuthenticationException exception) {
    boolean expired = request.getRequestedSessionId() != null && !request.isRequestedSessionIdValid();
    return getLoginFormUrl() + (expired ? "?expired=1" : "");
  }
}
