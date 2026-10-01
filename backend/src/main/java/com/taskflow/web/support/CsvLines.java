package com.taskflow.web.support;

import java.util.ArrayList;
import java.util.List;

/** RFC 4180 CSV, one line at a time: the import parses, the export quotes. */
public final class CsvLines {

  private CsvLines() {}

  /** Commas separate cells; a quoted cell may contain commas and "" for a quote. */
  public static List<String> parse(String line) {
    List<String> cells = new ArrayList<>();
    StringBuilder current = new StringBuilder();
    boolean quoted = false;
    for (int i = 0; i < line.length(); i++) {
      char c = line.charAt(i);
      if (quoted) {
        if (c == '"' && i + 1 < line.length() && line.charAt(i + 1) == '"') {
          current.append('"');
          i++;
        } else if (c == '"') {
          quoted = false;
        } else {
          current.append(c);
        }
      } else if (c == '"') {
        quoted = true;
      } else if (c == ',') {
        cells.add(current.toString());
        current.setLength(0);
      } else {
        current.append(c);
      }
    }
    cells.add(current.toString());
    return cells;
  }

  public static String get(List<String> cells, int index) {
    return index < cells.size() ? cells.get(index) : "";
  }

  /** A quoted cell: quotes doubled; formula triggers (= + - @ tab CR) neutralised with a leading ' (CSV injection). */
  public static String cell(String value) {
    String text = value == null ? "" : value;
    if (!text.isEmpty() && "=+-@\t\r".indexOf(text.charAt(0)) >= 0) text = "'" + text;
    return "\"" + text.replace("\"", "\"\"") + "\"";
  }
}
