package com.taskflow.web.interceptor;

import com.taskflow.security.CurrentUser;
import com.taskflow.web.support.ApiRequests;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.context.i18n.LocaleContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

/**
 * A HandlerInterceptor runs around EVERY controller call (preHandle → controller → postHandle → view → afterCompletion).
 * Here: the request attributes the shared layout (header.jspf, nav.jspf) needs on every page, so no controller has to
 * remember them:
 *   currentUser   the logged-in AuthUser or null              ${currentUser.displayName}
 *   lang          "en" | "vi"                                 <html lang="${lang}">
 *   currentPath   "/tasks/new" (inside the app)               which nav link is active
 *   currentUrl    "/taskflow/tasks?status=DONE"               where the theme/language switches send the user back
 * Also runs for Spring Boot's error pages (BasicErrorController is a controller too).
 */
@Component
public class ViewGlobalsInterceptor implements HandlerInterceptor {

  @Override
  public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
    request.setAttribute("currentUser", CurrentUser.orNull());
    request.setAttribute("lang", LocaleContextHolder.getLocale().getLanguage());
    if (request.getAttribute("currentPath") == null) {           // keep the ORIGINAL page's path on an error dispatch
      String query = request.getQueryString();
      request.setAttribute("currentPath", ApiRequests.path(request));
      request.setAttribute("currentUrl", request.getRequestURI() + (query == null ? "" : "?" + query));
    }
    return true;                                                  // false would stop the request here
  }
}
