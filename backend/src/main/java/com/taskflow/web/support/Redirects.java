package com.taskflow.web.support;

import jakarta.servlet.http.HttpServletRequest;

/**
 * The one place that decides whether a user-supplied redirect target is acceptable (the theme and language switches'
 * returnTo). Only paths INSIDE this application; anything else → the fallback. An absolute URL (https://evil.example),
 * a protocol-relative one (//evil.example), a backslash trick (/\evil.example) or CR/LF is refused: no open redirect.
 * (The login's "go back where you were" is Spring Security's RequestCache now: it never takes a URL from a parameter.)
 */
public final class Redirects {

  private Redirects() {}

  public static String safeLocalPath(HttpServletRequest request, String target, String fallback) {
    String appRoot = request.getContextPath() + "/";
    if (target == null || !target.startsWith(appRoot)) return fallback;
    if (target.startsWith("//") || target.contains("\\") || target.contains("\r") || target.contains("\n")) return fallback;
    return target;
  }
}
