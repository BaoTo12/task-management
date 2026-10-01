package com.taskflow.security.handler;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.web.RedirectStrategy;
import org.springframework.web.util.UriComponentsBuilder;

/**
 * Redirects with 303 See Other: after a POST (the login form, logout), the browser must GET the next page.
 * Spring Security's DefaultRedirectStrategy sends 302. Context-relative targets ("/tasks") get the context path.
 */
public class SeeOtherRedirectStrategy implements RedirectStrategy {

  @Override
  public void sendRedirect(HttpServletRequest request, HttpServletResponse response, String url) {
    boolean absolute = UriComponentsBuilder.fromUriString(url).build().getScheme() != null;
    String location = absolute ? url : request.getContextPath() + url;
    response.setStatus(HttpServletResponse.SC_SEE_OTHER);
    response.setHeader("Location", response.encodeRedirectURL(location));
  }
}
