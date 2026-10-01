package com.taskflow.service;

import com.taskflow.entity.User;
import com.taskflow.repository.UserRepository;
import com.taskflow.security.AuthUser;
import com.taskflow.security.LoginThrottle;
import java.util.Optional;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Checks a username and password. Knows nothing about HTTP or sessions: that's Spring Security's job
 * (TaskflowAuthenticationProvider calls this, then the SecurityContext is stored in the session).
 *   - throttled → refused before any check
 *   - unknown user → the SAME work (a BCrypt check against a dummy hash) and the SAME answer as a wrong password,
 *     so neither the message nor the response time reveals which usernames exist
 *   - every outcome is written to the audit log
 */
@Service
public class AuthService {

  public enum Outcome { SUCCESS, INVALID, THROTTLED }

  public record LoginResult(Outcome outcome, AuthUser user) {
    static LoginResult of(Outcome outcome) { return new LoginResult(outcome, null); }
  }

  private final UserRepository users;
  private final AuditService audit;
  private final PasswordEncoder passwords;
  private final LoginThrottle throttle;
  private final String dummyHash;

  public AuthService(UserRepository users, AuditService audit, PasswordEncoder passwords, LoginThrottle throttle) {
    this.users = users;
    this.audit = audit;
    this.passwords = passwords;
    this.throttle = throttle;
    this.dummyHash = passwords.encode("no-such-user-dummy-password");
  }

  @Transactional(readOnly = true)
  public LoginResult login(String username, String password, String ip) {
    String name = username == null ? "" : username.strip();
    String pass = password == null ? "" : password;
    if (throttle.isBlocked(name, ip)) {
      audit.record("LOGIN_THROTTLED", name, ip, null);
      return LoginResult.of(Outcome.THROTTLED);
    }
    Optional<UserRepository.Credentials> credentials = name.isEmpty() ? Optional.empty() : users.findCredentials(name);
    boolean valid;
    if (credentials.isEmpty()) {
      passwords.matches(pass, dummyHash);                         // same cost as a real check
      valid = false;
    } else {
      valid = passwords.matches(pass, credentials.get().getPasswordHash()) && credentials.get().isEnabled();
    }
    if (!valid) {
      throttle.recordFailure(name, ip);
      audit.record("LOGIN_FAIL", name, ip, null);
      return LoginResult.of(Outcome.INVALID);
    }
    throttle.recordSuccess(name);
    audit.record("LOGIN_OK", name, ip, null);
    UserRepository.Credentials user = credentials.get();
    return new LoginResult(Outcome.SUCCESS, new AuthUser(user.getId(), user.getUsername(), user.getDisplayName(), user.getRole()));
  }

  /** The user's profile (for /api/auth/me and the login response). */
  @Transactional(readOnly = true)
  public Optional<User> profile(long userId) {
    return users.findById(userId);
  }

  public void loggedOut(String username, String ip) {
    audit.record("LOGOUT", username, ip, null);
  }

  public long throttleSeconds() {
    return throttle.period().getSeconds();
  }
}
