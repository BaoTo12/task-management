package com.taskflow.service;

import com.taskflow.entity.User;
import com.taskflow.repository.UserRepository;
import com.taskflow.security.AuthUser;
import java.util.List;
import java.util.Set;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * What an admin can do to accounts: enable, disable, change the role.
 *   - @PreAuthorize on the CLASS: every method checks the caller is an admin, although /admin/** is already protected
 *     by URL (defence in depth: a future controller or job calling this can't forget the check)
 *   - an admin can't change their OWN account (no locking yourself out, no accidental self-demotion)
 *   - the role comes from an allow-list: "SUPERADMIN" or "ADMIN'--" is refused, not stored
 *   - every change is audited, and AccountRegistry is refreshed: open sessions see it on their next request
 */
@Service
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class UserAdminService {

  public enum Change { DONE, NOT_FOUND, OWN_ACCOUNT }

  public static final Set<String> ROLES = Set.of("USER", "ADMIN");

  private final UserRepository users;
  private final AccountRegistry registry;
  private final AuditService audit;

  @Transactional(readOnly = true)
  public List<User> accounts() {
    return users.findAllByOrderByUsernameAsc();
  }

  @Transactional
  public Change setEnabled(AuthUser caller, long userId, boolean enabled, String ip) {
    if (userId == caller.getId()) return Change.OWN_ACCOUNT;
    if (users.updateEnabled(userId, enabled) == 0) return Change.NOT_FOUND;
    registry.refresh();
    audit.record(enabled ? "USER_ENABLED" : "USER_DISABLED", caller.getUsername(), ip, "user " + userId);
    return Change.DONE;
  }

  /** IllegalArgumentException for a role outside the allow-list (the controller validates first: a 400). */
  @Transactional
  public Change changeRole(AuthUser caller, long userId, String role, String ip) {
    if (!ROLES.contains(role)) throw new IllegalArgumentException("Unknown role");
    if (userId == caller.getId()) return Change.OWN_ACCOUNT;
    if (users.updateRole(userId, role) == 0) return Change.NOT_FOUND;
    registry.refresh();
    audit.record("ROLE_CHANGED", caller.getUsername(), ip, "user " + userId + " → " + role);
    return Change.DONE;
  }
}
