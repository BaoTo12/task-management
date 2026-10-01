package com.taskflow.security;

import com.taskflow.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.web.authentication.WebAuthenticationDetails;
import org.springframework.stereotype.Component;

/**
 * How Spring Security checks a username and password in TaskFlow: it hands the UNauthenticated token (what the user
 * typed) to this provider, which asks AuthService (throttle → BCrypt → audit) and returns an AUTHENTICATED token whose
 * principal is our AuthUser, or throws an AuthenticationException. Used by BOTH logins: the JSP form (formLogin) and
 * the JSON one (AuthApiController → AuthenticationManager).
 * Not a UserDetailsService + DaoAuthenticationProvider on purpose: those can't throttle or audit the way we need.
 */
@Component
@RequiredArgsConstructor
public class TaskflowAuthenticationProvider implements AuthenticationProvider {

  private final AuthService auth;

  @Override
  public Authentication authenticate(Authentication authentication) {
    String username = authentication.getName();
    String password = authentication.getCredentials() == null ? "" : authentication.getCredentials().toString();
    String ip = authentication.getDetails() instanceof WebAuthenticationDetails details ? details.getRemoteAddress() : "unknown";
    AuthService.LoginResult result = auth.login(username, password, ip);
    return switch (result.outcome()) {
      case SUCCESS -> result.user().toAuthentication();
      case THROTTLED -> throw new LoginThrottledException(auth.throttleSeconds());
      case INVALID -> throw new BadCredentialsException("Invalid username or password");   // ONE message for every failure
    };
  }

  @Override
  public boolean supports(Class<?> authentication) {
    return UsernamePasswordAuthenticationToken.class.isAssignableFrom(authentication);
  }
}
