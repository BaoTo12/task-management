package com.taskflow.controller.web;

import com.taskflow.config.TaskflowProperties;
import com.taskflow.exception.BadRequestException;
import com.taskflow.web.support.Redirects;
import com.taskflow.web.support.TaskflowLocaleResolver;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.time.Duration;
import java.util.Locale;
import java.util.Set;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.servlet.LocaleResolver;

/**
 * POST /preferences/theme     (theme = light | dark | system, returnTo) → the tf_theme cookie
 * POST /preferences/language  (lang = en | vi, returnTo)                 → the tf_lang cookie (via the LocaleResolver)
 * The SAME cookies the React app reads and writes: cookies are per HOST, so both clients share them. Values come from
 * allow-lists; returnTo must be a path inside this app (no open redirect). Answered with 303 back to the page.
 */
@Controller
@RequestMapping("/preferences")
@RequiredArgsConstructor
public class PreferencesController {

  static final String THEME_COOKIE = "tf_theme";
  private static final Set<String> THEMES = Set.of("light", "dark", "system");

  private final LocaleResolver localeResolver;
  private final TaskflowProperties properties;

  @PostMapping("/theme")
  String theme(@RequestParam String theme, @RequestParam(required = false) String returnTo,
               HttpServletRequest request, HttpServletResponse response) {
    if (!THEMES.contains(theme)) throw new BadRequestException("theme must be light, dark or system");
    // Not HttpOnly: the React app reads it with js-cookie. "system" = no preference: delete the cookie (maxAge 0).
    ResponseCookie cookie = ResponseCookie.from(THEME_COOKIE, theme).path("/")
        .maxAge("system".equals(theme) ? Duration.ZERO : Duration.ofDays(365))
        .sameSite("Lax").secure(properties.secureCookies()).build();
    response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
    return back(request, returnTo);
  }

  @PostMapping("/language")
  String language(@RequestParam String lang, @RequestParam(required = false) String returnTo,
                  HttpServletRequest request, HttpServletResponse response) {
    if (!TaskflowLocaleResolver.LANGUAGES.contains(lang)) throw new BadRequestException("Unsupported language.");
    localeResolver.setLocale(request, response, Locale.forLanguageTag(lang));
    return back(request, returnTo);
  }

  /** returnTo is a full path ("/taskflow/tasks?…"): redirect:… would prefix the context path a second time. */
  private static String back(HttpServletRequest request, String returnTo) {
    String target = Redirects.safeLocalPath(request, returnTo, request.getContextPath() + "/tasks");
    return "redirect:" + target.substring(request.getContextPath().length());
  }
}
