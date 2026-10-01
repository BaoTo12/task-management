package com.taskflow.security;

import static org.assertj.core.api.Assertions.assertThat;

import com.taskflow.config.TaskflowProperties;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneId;
import java.time.ZoneOffset;
import java.util.List;
import org.junit.jupiter.api.Test;

/** A clock the TEST controls makes time-based rules testable: no sleeping, no flaky timing. */
class LoginThrottleTest {

  /** A Clock whose time the test moves forward by hand. */
  static final class MutableClock extends Clock {
    private Instant now;

    MutableClock(Instant start) { this.now = start; }

    void advance(Duration duration) { now = now.plus(duration); }

    @Override public ZoneId getZone() { return ZoneOffset.UTC; }
    @Override public Clock withZone(ZoneId zone) { return this; }
    @Override public Instant instant() { return now; }
  }

  private static TaskflowProperties properties() {
    return new TaskflowProperties(false, new TaskflowProperties.Cors(List.of()), 500,
        new TaskflowProperties.LoginThrottle(3, 10, Duration.ofMinutes(15)), new TaskflowProperties.CsvImport(500));
  }

  @Test
  void blocksAnAccountAfterTooManyFailures() {
    LoginThrottle throttle = new LoginThrottle(properties(), new MutableClock(Instant.parse("2026-10-01T08:00:00Z")));
    for (int i = 0; i < 3; i++) throttle.recordFailure("bob", "10.0.0." + i);
    assertThat(throttle.isBlocked("bob", "10.0.0.99")).isTrue();
    assertThat(throttle.isBlocked("alice", "10.0.0.99")).isFalse();
  }

  @Test
  void theBlockEndsWithTheWindow() {
    MutableClock clock = new MutableClock(Instant.parse("2026-10-01T08:00:00Z"));
    LoginThrottle throttle = new LoginThrottle(properties(), clock);
    for (int i = 0; i < 3; i++) throttle.recordFailure("bob", "10.0.0.1");
    assertThat(throttle.isBlocked("bob", "10.0.0.1")).isTrue();
    clock.advance(Duration.ofMinutes(16));
    assertThat(throttle.isBlocked("bob", "10.0.0.1")).isFalse();
  }

  @Test
  void aSuccessfulLoginForgetsTheAccountsFailures() {
    LoginThrottle throttle = new LoginThrottle(properties(), new MutableClock(Instant.parse("2026-10-01T08:00:00Z")));
    throttle.recordFailure("bob", "10.0.0.1");
    throttle.recordFailure("bob", "10.0.0.1");
    throttle.recordSuccess("bob");
    throttle.recordFailure("bob", "10.0.0.1");
    assertThat(throttle.isBlocked("bob", "10.0.0.2")).isFalse();
  }
}
