package com.taskflow.web.servlet;

/** HTML escaping for the two servlets that write HTML by hand. JSPs use <c:out> / fn:escapeXml instead. */
public final class Html {

  private Html() {}

  public static String escape(String text) {
    if (text == null) return "";
    StringBuilder out = new StringBuilder(text.length() + 16);
    for (char c : text.toCharArray()) {
      switch (c) {
        case '<' -> out.append("&lt;");
        case '>' -> out.append("&gt;");
        case '&' -> out.append("&amp;");
        case '"' -> out.append("&quot;");
        case '\'' -> out.append("&#39;");
        default -> out.append(c);
      }
    }
    return out.toString();
  }
}
