package com.taskflow.web;

import java.text.MessageFormat;
import java.util.Locale;
import java.util.MissingResourceException;
import java.util.ResourceBundle;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.jsp.jstl.core.Config;

/**
 * S44 for CONTROLLERS: the same resource bundle the JSPs read with {@code <fmt:message>}, for texts a servlet creates
 * itself (page titles, flash messages). One bundle, one locale decision (LocaleFilter), so a page never mixes languages.
 *
 * <pre>
 *   request.setAttribute("pageTitle", Messages.get(request, "page.tasks"));
 *   Flash.put(request, Messages.get(request, "flash.welcome", user.getDisplayName()));
 * </pre>
 *
 * Same rules as {@code <fmt:message>}: MessageFormat is applied ONLY when there are arguments, so a text without
 * parameters keeps a plain apostrophe ("can't"), while one with parameters must write it as '' (44.18).
 * Arguments are NOT escaped here: JSPs print messages with {@code <c:out>} (flash.jsp does).
 */
public final class Messages {

  /** The base name JSTL uses too (web.xml: javax.servlet.jsp.jstl.fmt.localizationContext). */
  private static final String BUNDLE = "i18n.messages";

  /**
   * No fallback to the JVM's default locale: on a server running in Vietnamese, an English request must still get
   * the BASE (English) bundle, not messages_vi. This is the lookup order JSTL uses as well.
   */
  private static final ResourceBundle.Control CONTROL =
      ResourceBundle.Control.getNoFallbackControl(ResourceBundle.Control.FORMAT_PROPERTIES);

  private Messages() {}

  public static String get(HttpServletRequest request, String key, Object... args) {
    Locale locale = locale(request);
    String pattern;
    try {
      pattern = ResourceBundle.getBundle(BUNDLE, locale, Messages.class.getClassLoader(), CONTROL).getString(key);
    } catch (MissingResourceException e) {
      return "???" + key + "???"; // what <fmt:message> shows for a missing key: visible in the page, easy to grep
    }
    return args.length == 0 ? pattern : new MessageFormat(pattern, locale).format(args);
  }

  /** The locale LocaleFilter chose; English when the filter hasn't run (e.g. the maintenance filter runs before it). */
  static Locale locale(HttpServletRequest request) {
    Object value = Config.get(request, Config.FMT_LOCALE);
    if (value instanceof Locale locale) return locale;
    if (value instanceof String tag) return Locale.forLanguageTag(tag.replace('_', '-'));
    return Locale.ENGLISH;
  }
}
