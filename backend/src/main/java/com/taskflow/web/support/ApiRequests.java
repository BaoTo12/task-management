package com.taskflow.web.support;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.web.util.UrlPathHelper;

/**
 * "Is this request for the JSON API?", decided from the DECODED path inside the application ("/api/tasks/5"), never
 * from the raw getRequestURI(). Spring Security's firewall has already rejected "..", "//" and ";" tricks.
 */
public final class ApiRequests {

  private ApiRequests() {}

  public static String path(HttpServletRequest request) {
    return UrlPathHelper.defaultInstance.getPathWithinApplication(request);
  }

  public static boolean isApi(HttpServletRequest request) {
    String path = path(request);
    return path.equals("/api") || path.startsWith("/api/");
  }
}
