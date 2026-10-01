package com.taskflow.web.support;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.time.Duration;
import java.util.Collections;
import java.util.List;
import java.util.Locale;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.web.servlet.LocaleResolver;

/**
 * Which language this request is rendered in, decided by Spring MVC's LocaleResolver (DispatcherServlet asks it once
 * per request and exposes the answer to controllers, <fmt:message> and Bean Validation messages):
 *   1. the tf_lang cookie, if its value is on the ALLOW-LIST (en, vi): a cookie is user input. The React app's
 *      i18next reads and writes the SAME cookie, so one switch changes both clients.
 *   2. otherwise the browser's Accept-Language, best match first
 *   3. otherwise English
 * Spring's own CookieLocaleResolver has no allow-list, so TaskFlow brings its own (registered in WebMvcConfig).
 */
@RequiredArgsConstructor
public class TaskflowLocaleResolver implements LocaleResolver {

  public static final String COOKIE = "tf_lang";
  public static final List<String> LANGUAGES = List.of("en", "vi");

  private final boolean secureCookies;

  @Override
  public Locale resolveLocale(HttpServletRequest request) {
    Cookie[] cookies = request.getCookies();
    if (cookies != null) {
      for (Cookie cookie : cookies) {
        if (COOKIE.equals(cookie.getName()) && LANGUAGES.contains(cookie.getValue())) return Locale.forLanguageTag(cookie.getValue());
      }
    }
    if (request.getHeader("Accept-Language") != null) {          // without it, getLocales() is the SERVER's default
      for (Locale locale : Collections.list(request.getLocales())) {
        if (LANGUAGES.contains(locale.getLanguage())) return Locale.forLanguageTag(locale.getLanguage());
      }
    }
    return Locale.ENGLISH;
  }

  /** Not HttpOnly: i18next reads it in the browser. A preference, not a secret. Path=/: the React app's pages too. */
  @Override
  public void setLocale(HttpServletRequest request, HttpServletResponse response, Locale locale) {
    String lang = locale == null || !LANGUAGES.contains(locale.getLanguage()) ? "en" : locale.getLanguage();
    ResponseCookie cookie = ResponseCookie.from(COOKIE, lang)
        .path("/").maxAge(Duration.ofDays(365)).sameSite("Lax").secure(secureCookies).build();
    response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
  }
}
