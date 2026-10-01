package com.taskflow.service;

import com.taskflow.entity.User;
import com.taskflow.repository.UserRepository;
import jakarta.annotation.PostConstruct;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

/**
 * Every account's CURRENT state (enabled? which role?), in memory, so AccountStateFilter can check it on every
 * request without a query. A session holds a COPY of the user taken at login; this is the truth it's compared with.
 * Thread safety: a volatile reference to an IMMUTABLE map, replaced as a whole by refresh() after an admin changes an
 * account: readers see the old map or the new one, never a half-built one.
 * One server only: with several, each would need to hear about the change (a shared cache, or a short expiry).
 */
@Component
@RequiredArgsConstructor
public class AccountRegistry {

  public record State(boolean enabled, String role) {}

  private final UserRepository users;
  private volatile Map<Long, State> states;

  /** At startup, after injection: Flyway has already migrated (the repositories depend on it). */
  @PostConstruct
  void load() {
    refresh();
  }

  /** Empty for an unknown id (a deleted user): treat it like a disabled one. */
  public Optional<State> state(long userId) {
    return Optional.ofNullable(states.get(userId));
  }

  public void refresh() {
    states = users.findAll().stream()
        .collect(Collectors.toUnmodifiableMap(User::getId, u -> new State(u.isEnabled(), u.getRole())));
  }
}
