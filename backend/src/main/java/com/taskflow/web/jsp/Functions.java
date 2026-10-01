package com.taskflow.web.jsp;

import java.time.Duration;

/**
 * Static methods exposed to EL as functions through WEB-INF/tlds/taskflow.tld: ${tf:truncate(task.title, 40)}.
 * EL functions return values; the page still escapes them (<c:out>).
 */
public final class Functions {

  private Functions() {}

  /** At most `max` characters; longer texts are cut and end with "…". Null stays null. */
  public static String truncate(String text, int max) {
    if (text == null || text.length() <= max) return text;
    return text.substring(0, Math.max(0, max - 1)).stripTrailing() + "…";
  }

  /** 135 → "2h 15m", 45 → "45m": tracked time on the task page and the reports. */
  public static String minutes(long minutes) {
    Duration duration = Duration.ofMinutes(Math.max(0, minutes));
    long hours = duration.toHours();
    long rest = duration.toMinutesPart();
    return hours == 0 ? rest + "m" : hours + "h " + rest + "m";
  }
}
