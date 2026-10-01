package com.taskflow.web.jsp;

import jakarta.servlet.jsp.PageContext;
import jakarta.servlet.jsp.jstl.core.Config;
import java.util.Locale;

/**
 * The locale JSTL's fmt tags use for this request, so custom tags format the same way. Spring's JstlView puts the
 * locale chosen by TaskflowLocaleResolver there (Config.FMT_LOCALE) before it forwards to the JSP.
 */
final class Locales {

  private Locales() {}

  static Locale current(PageContext pageContext) {
    Object value = Config.find(pageContext, Config.FMT_LOCALE);   // page → request → session → application scope
    if (value instanceof Locale locale) return locale;
    if (value instanceof String tag) return Locale.forLanguageTag(tag.replace('_', '-'));
    return pageContext.getRequest().getLocale();
  }
}
