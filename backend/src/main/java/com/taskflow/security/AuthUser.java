package com.taskflow.security;

import java.io.Serializable;
import java.util.List;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;

/**
 * The logged-in user: the PRINCIPAL of Spring Security's Authentication, kept in the session's SecurityContext.
 * Small, serialisable (sessions may be written to disk), no secrets: never the password hash, never the whole row.
 * Controllers receive it with @AuthenticationPrincipal AuthUser user; services take it as "the caller".
 */
@Getter
@RequiredArgsConstructor
public final class AuthUser implements Serializable {

  private static final long serialVersionUID = 1L;

  private final long id;
  private final String username;
  private final String displayName;
  private final String role;

  public boolean isAdmin() {
    return "ADMIN".equals(role);
  }

  /** Spring Security checks AUTHORITIES: hasRole('ADMIN') means the authority "ROLE_ADMIN". */
  public List<GrantedAuthority> authorities() {
    return List.of(new SimpleGrantedAuthority("ROLE_" + role));
  }

  /** An authenticated token for this user (no credentials kept: the password is never stored in the session). */
  public Authentication toAuthentication() {
    return UsernamePasswordAuthenticationToken.authenticated(this, null, authorities());
  }

  /** The same user with another role (an admin changed it while this session was open). */
  public AuthUser withRole(String newRole) {
    return new AuthUser(id, username, displayName, newRole);
  }

  @Override
  public String toString() {
    return username;   // Authentication.getName() and logs show the username, nothing else
  }
}
