package com.taskflow.security;

import org.springframework.security.core.AuthenticationException;

/** Too many failed logins: refused BEFORE the password is checked. The handlers answer 429 + Retry-After. */
public class LoginThrottledException extends AuthenticationException {

  private final long retryAfterSeconds;

  public LoginThrottledException(long retryAfterSeconds) {
    super("Too many failed attempts");
    this.retryAfterSeconds = retryAfterSeconds;
  }

  public long retryAfterSeconds() {
    return retryAfterSeconds;
  }
}
