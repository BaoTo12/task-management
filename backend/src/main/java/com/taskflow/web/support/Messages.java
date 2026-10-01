package com.taskflow.web.support;

import jakarta.servlet.http.HttpServletRequest;
import java.util.Locale;
import lombok.RequiredArgsConstructor;
import org.springframework.context.MessageSource;
import org.springframework.context.i18n.LocaleContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.LocaleResolver;

/**
 * Texts created in JAVA (page titles, flash messages) from the SAME bundle the JSPs read with <fmt:message>
 * (src/main/resources/i18n/messages*.properties, spring.messages.basename). One bundle, one locale decision.
 *
 *   in a controller:   messages.get("flash.task.saved")       the locale DispatcherServlet resolved (LocaleContextHolder)
 *   in a filter:       messages.get(request, "flash.sessionEnded")   runs BEFORE DispatcherServlet: ask the resolver
 *
 * Same rule as <fmt:message>: MessageFormat applies only when there are arguments, so "can't" stays as typed in a
 * message without parameters, and must be written "can''t" in one with parameters.
 */
@Component
@RequiredArgsConstructor
public class Messages {

  private final MessageSource source;
  private final LocaleResolver localeResolver;

  public String get(String key, Object... args) {
    return get(LocaleContextHolder.getLocale(), key, args);
  }

  public String get(HttpServletRequest request, String key, Object... args) {
    return get(localeResolver.resolveLocale(request), key, args);
  }

  private String get(Locale locale, String key, Object... args) {
    // "???key???" is what <fmt:message> shows for a missing key: visible in the page, easy to grep.
    return source.getMessage(key, args.length == 0 ? null : args, "???" + key + "???", locale);
  }
}
