package com.taskflow.web.support;

/**
 * LENIENT parsing for optional filters in a page URL (?category=abc → no filter, not an error page).
 * Required values use typed @RequestParam (long id): Spring converts them and answers 400 for "abc".
 */
public final class Params {

  private Params() {}

  /** A positive id ("42"), or null for null, "", "abc", "-1", "0", "9999999999999999999". */
  public static Long positiveId(String raw) {
    if (raw == null || raw.isBlank()) return null;
    try {
      long id = Long.parseLong(raw.trim());
      return id > 0 ? id : null;
    } catch (NumberFormatException e) {
      return null;
    }
  }

  /** Blank → null, otherwise stripped (search boxes). */
  public static String text(String raw) {
    return raw == null || raw.isBlank() ? null : raw.strip();
  }
}
