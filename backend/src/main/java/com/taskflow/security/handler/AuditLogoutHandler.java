package com.taskflow.security.handler;

import com.taskflow.security.AuthUser;
import com.taskflow.security.SessionKeys;
import com.taskflow.service.AuthService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.web.authentication.logout.LogoutHandler;
import org.springframework.stereotype.Component;

/**
 * Runs during a logout (both chains), BEFORE Spring Security's own handler invalidates the session:
 *   1. a LOGOUT audit event
 *   2. the SecurityContext is removed from the session FIRST, so SessionRegistry sees a logout, not a timeout
 *      (invalidate() would otherwise report the session as destroyed while the user is still in it)
 */
@Component
@RequiredArgsConstructor
public class AuditLogoutHandler implements LogoutHandler {

  private final AuthService auth;

  @Override
  public void logout(HttpServletRequest request, HttpServletResponse response, Authentication authentication) {
    if (authentication != null && authentication.getPrincipal() instanceof AuthUser user) {
      auth.loggedOut(user.getUsername(), request.getRemoteAddr());
    }
    HttpSession session = request.getSession(false);
    if (session != null) session.removeAttribute(SessionKeys.SECURITY_CONTEXT);
  }
}
