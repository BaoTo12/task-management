package com.taskflow.security;

import org.springframework.security.web.context.HttpSessionSecurityContextRepository;

/** The session attribute names TaskFlow reads or writes itself. */
public final class SessionKeys {

  /** Where Spring Security keeps the SecurityContext (and so the AuthUser) in the HttpSession. */
  public static final String SECURITY_CONTEXT = HttpSessionSecurityContextRepository.SPRING_SECURITY_CONTEXT_KEY;

  /** The IP the user logged in from: a timeout has no request, but its audit event needs an IP. */
  public static final String LOGIN_IP = "loginIp";

  private SessionKeys() {}
}
