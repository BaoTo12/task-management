package com.taskflow.web.jsp;

import jakarta.servlet.jsp.PageContext;
import jakarta.servlet.jsp.tagext.SimpleTagSupport;
import java.io.IOException;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.format.FormatStyle;

/**
 * <tf:date value="${task.dueDate}"/> → "Oct 3, 2026" / "3 thg 10, 2026".
 * Why a custom tag: JSTL's <fmt:formatDate> (3.0 too) only accepts java.util.Date, and TaskFlow's dates are
 * java.time.LocalDate. The locale is the one fmt uses, so a page never mixes two languages.
 */
public class DateTag extends SimpleTagSupport {

  private LocalDate value;

  public void setValue(LocalDate value) {       // the container calls a setter per attribute (a JavaBean property)
    this.value = value;
  }

  @Override
  public void doTag() throws IOException {
    String text = value == null ? "—"
        : value.format(DateTimeFormatter.ofLocalizedDate(FormatStyle.MEDIUM).withLocale(Locales.current((PageContext) getJspContext())));
    getJspContext().getOut().write(text);         // digits, letters, punctuation from the JDK's locale data: nothing to escape
  }
}
