package com.taskflow.security;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

/**
 * Who is logged in, for code that can't take @AuthenticationPrincipal (filters, interceptors, exception handlers).
 * SecurityContextHolder is a ThreadLocal filled by Spring Security for the duration of each request.
 */
public final class CurrentUser {

  private CurrentUser() {}

  /** The logged-in user, or null (anonymous: the principal is then the String "anonymousUser"). */
  public static AuthUser orNull() {
    Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
    return authentication != null && authentication.getPrincipal() instanceof AuthUser user ? user : null;
  }
}
