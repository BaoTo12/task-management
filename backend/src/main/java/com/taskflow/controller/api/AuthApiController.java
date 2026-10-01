package com.taskflow.controller.api;

import com.taskflow.dto.request.LoginRequest;
import com.taskflow.exception.ApiException;
import com.taskflow.security.AuthUser;
import com.taskflow.security.LoginThrottledException;
import com.taskflow.security.SessionKeys;
import com.taskflow.service.AuthService;
import com.taskflow.dto.response.UserDto;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetails;
import org.springframework.security.web.authentication.session.SessionAuthenticationStrategy;
import org.springframework.security.web.context.SecurityContextRepository;
import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Authentication for the SPA, on the SAME session as the Admin Portal (one JSESSIONID, HttpOnly):
 *   GET  /api/auth/csrf    → 204 + a fresh XSRF-TOKEN cookie (the SPA calls it first)
 *   POST /api/auth/login   {"username","password"} → 200 UserDto | 401 BAD_CREDENTIALS | 429 + Retry-After | 400
 *   POST /api/auth/logout  → 204 (handled by Spring Security's LogoutFilter: SecurityConfig.apiChain)
 *   GET  /api/auth/me      → 200 UserDto | 401 UNAUTHENTICATED ("who am I?" after a page reload)
 * A JSON login has to do by hand what formLogin does for the pages: authenticate, protect against session fixation,
 * rotate the CSRF token, and store the SecurityContext in the session. Login still needs the CSRF header: no login CSRF.
 */
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthApiController {

  private final AuthenticationManager authenticationManager;
  @Qualifier("apiSessionAuthenticationStrategy")      // copied onto the constructor parameter (lombok.config)
  private final SessionAuthenticationStrategy sessionStrategy;
  private final SecurityContextRepository contextRepository;
  private final AuthService auth;

  /** CsrfToken is resolved by Spring Security; reading it is what writes the (deferred) cookie. */
  @GetMapping("/csrf")
  ResponseEntity<Void> csrf(CsrfToken token) {
    token.getToken();
    return ResponseEntity.noContent().build();
  }

  @PostMapping("/login")
  UserDto login(@Valid @RequestBody LoginRequest body, HttpServletRequest request, HttpServletResponse response) {
    UsernamePasswordAuthenticationToken attempt =
        UsernamePasswordAuthenticationToken.unauthenticated(body.username(), body.password());
    attempt.setDetails(new WebAuthenticationDetails(request));                // the IP, for the throttle and the audit
    Authentication authentication;
    try {
      authentication = authenticationManager.authenticate(attempt);
    } catch (LoginThrottledException e) {
      response.setHeader("Retry-After", String.valueOf(e.retryAfterSeconds()));
      throw ApiException.tooManyRequests();
    } catch (AuthenticationException e) {
      throw ApiException.badCredentials();
    }
    sessionStrategy.onAuthentication(authentication, request, response);   // new session id + new CSRF token
    SecurityContext context = SecurityContextHolder.createEmptyContext();
    context.setAuthentication(authentication);
    SecurityContextHolder.setContext(context);
    contextRepository.saveContext(context, request, response);              // → the HttpSession: logged in from now on
    request.getSession().setAttribute(SessionKeys.LOGIN_IP, request.getRemoteAddr());
    CsrfToken fresh = (CsrfToken) request.getAttribute(CsrfToken.class.getName());
    if (fresh != null) fresh.getToken();                                    // write the NEW XSRF-TOKEN cookie now
    return profile((AuthUser) authentication.getPrincipal());
  }

  @GetMapping("/me")
  UserDto me(@AuthenticationPrincipal AuthUser user) {
    if (user == null) throw ApiException.unauthenticated();                 // permitAll path: we answer anonymous callers
    return profile(user);
  }

  private UserDto profile(AuthUser user) {
    return auth.profile(user.getId()).map(UserDto::from).orElseThrow(ApiException::unauthenticated);
  }
}
