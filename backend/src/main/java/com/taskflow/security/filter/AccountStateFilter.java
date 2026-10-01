package com.taskflow.security.filter;

import com.taskflow.exception.ApiException;
import com.taskflow.exception.handler.ApiErrorWriter;
import com.taskflow.security.AuthUser;
import com.taskflow.security.CurrentUser;
import com.taskflow.security.SessionKeys;
import com.taskflow.service.AccountRegistry;
import com.taskflow.service.AuditService;
import com.taskflow.web.support.ApiRequests;
import com.taskflow.web.support.Flash;
import com.taskflow.web.support.Messages;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import java.io.IOException;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.context.SecurityContextRepository;
import org.springframework.web.filter.OncePerRequestFilter;

/**
 * The session holds a COPY of the user taken at login. On every request it's compared with the account's CURRENT state
 * (AccountRegistry, in memory):
 *   disabled by an admin since → the session ends NOW (JSON 401 for the API, the login page with a message otherwise)
 *   role changed since         → the session gets the new role and a NEW session id (a privilege change, like a login)
 * Spring Security doesn't do this by itself: a session stays valid until it expires.
 *
 * Added to BOTH security chains in SecurityConfig with addFilterBefore(…, AuthorizationFilter.class): after the
 * SecurityContext is loaded, before the URL rules are checked. Deliberately NOT a @Component: Spring Boot would also
 * register every Filter bean as a plain servlet filter, running it a second time outside the security chain.
 */
@RequiredArgsConstructor
public class AccountStateFilter extends OncePerRequestFilter {

  private final AccountRegistry accounts;
  private final AuditService audit;
  private final Flash flash;
  private final Messages messages;
  private final ApiErrorWriter errors;
  private final SecurityContextRepository contextRepository;

  @Override
  protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
      throws ServletException, IOException {
    AuthUser user = CurrentUser.orNull();
    if (user != null) {
      Optional<AccountRegistry.State> state = accounts.state(user.getId());
      if (state.isEmpty() || !state.get().enabled()) {
        revoke(request, response, user);
        return;
      }
      if (!state.get().role().equals(user.getRole())) {
        SecurityContext context = SecurityContextHolder.createEmptyContext();
        context.setAuthentication(user.withRole(state.get().role()).toAuthentication());
        SecurityContextHolder.setContext(context);
        request.changeSessionId();
        contextRepository.saveContext(context, request, response);
      }
    }
    chain.doFilter(request, response);
  }

  private void revoke(HttpServletRequest request, HttpServletResponse response, AuthUser user) throws IOException {
    audit.record("SESSION_REVOKED", user.getUsername(), request.getRemoteAddr(), "account disabled");
    HttpSession session = request.getSession(false);
    if (session != null) {
      session.removeAttribute(SessionKeys.SECURITY_CONTEXT);   // a revocation, not a timeout (SessionRegistry)
      session.invalidate();
    }
    SecurityContextHolder.clearContext();
    if (ApiRequests.isApi(request)) {
      errors.write(request, response, ApiException.unauthenticated());
      return;
    }
    flash.message(request, response, messages.get(request, "flash.sessionEnded"));  // a NEW anonymous session carries it
    response.setStatus(HttpServletResponse.SC_SEE_OTHER);
    response.setHeader("Location", request.getContextPath() + "/login");
  }
}
