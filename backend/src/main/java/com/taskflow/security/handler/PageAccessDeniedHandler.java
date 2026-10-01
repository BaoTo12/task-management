package com.taskflow.security.handler;

import com.taskflow.security.AuthUser;
import com.taskflow.security.CurrentUser;
import com.taskflow.service.AuditService;
import com.taskflow.web.support.ApiRequests;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.web.access.AccessDeniedHandler;
import org.springframework.security.web.csrf.CsrfException;
import org.springframework.stereotype.Component;

/**
 * A logged-in USER on /admin/** (or a form posted without a valid _csrf token): audited, then sendError(403), which
 * Spring Boot's error dispatch renders with WEB-INF/views/error/403.jsp. The page says what happened, not why in
 * detail: the details (who, what, from where) are in the audit log.
 */
@Component
@RequiredArgsConstructor
public class PageAccessDeniedHandler implements AccessDeniedHandler {

  private final AuditService audit;

  @Override
  public void handle(HttpServletRequest request, HttpServletResponse response, AccessDeniedException e) throws IOException {
    AuthUser user = CurrentUser.orNull();
    String what = e instanceof CsrfException ? "invalid CSRF token" : "path";
    audit.record("ACCESS_DENIED", user == null ? null : user.getUsername(), request.getRemoteAddr(),
        what + ": " + request.getMethod() + " " + ApiRequests.path(request));
    response.sendError(HttpServletResponse.SC_FORBIDDEN);
  }
}
