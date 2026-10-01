package com.taskflow.security.handler;

import com.taskflow.exception.ApiException;
import com.taskflow.exception.handler.ApiErrorWriter;
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
 * A request Spring Security refuses with 403, for the API:
 *   missing / wrong X-XSRF-TOKEN  → 403 CSRF_TOKEN_INVALID (the SPA fetches /api/auth/csrf and retries)
 *   a role the caller lacks       → 403 FORBIDDEN, audited
 */
@Component
@RequiredArgsConstructor
public class JsonAccessDeniedHandler implements AccessDeniedHandler {

  private final ApiErrorWriter errors;
  private final AuditService audit;

  @Override
  public void handle(HttpServletRequest request, HttpServletResponse response, AccessDeniedException e) throws IOException {
    if (e instanceof CsrfException) {
      errors.write(request, response, ApiException.csrfInvalid());
      return;
    }
    AuthUser user = CurrentUser.orNull();
    audit.record("ACCESS_DENIED", user == null ? null : user.getUsername(), request.getRemoteAddr(),
        request.getMethod() + " " + ApiRequests.path(request));
    errors.write(request, response, ApiException.forbidden());
  }
}
