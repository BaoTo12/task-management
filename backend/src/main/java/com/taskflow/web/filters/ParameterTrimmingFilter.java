package com.taskflow.web.filters;

import java.io.IOException;
import java.util.Arrays;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.Map;
import javax.servlet.FilterChain;
import javax.servlet.ServletException;
import javax.servlet.http.HttpFilter;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletRequestWrapper;
import javax.servlet.http.HttpServletResponse;

/**
 * S40 (40.A) request WRAPPER: every form value arrives without leading/trailing whitespace, whichever servlet reads it.
 * "alice " at the login form, " Buy milk" in a title, "12 " as an id: all normalised once, here, instead of in each
 * controller (TaskForm still trims too: defence in depth costs nothing).
 *
 * - HttpFilter (Servlet 4.0): an abstract Filter that already casts to HTTP types, so doFilter receives
 *   HttpServletRequest/HttpServletResponse directly. No init/destroy boilerplate either.
 * - HttpServletRequestWrapper: every method delegates to the real request; we override only the parameter methods.
 *   The servlet can't tell the difference: it just sees trimmed values. The same idea as the response wrapper
 *   RequestLoggingFilter uses to learn the status code.
 * - PASSWORDS ARE NOT TRIMMED: a space can be part of a password, and changing it would lock the user out.
 *
 * Declared in web.xml right after the encoding filter: the charset must be set BEFORE the first getParameter call,
 * and this wrapper reads parameters lazily, only when a servlet asks.
 */
public class ParameterTrimmingFilter extends HttpFilter {

  @Override
  protected void doFilter(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
      throws IOException, ServletException {
    chain.doFilter(new TrimmedParametersRequest(request), response);
  }

  static final class TrimmedParametersRequest extends HttpServletRequestWrapper {

    TrimmedParametersRequest(HttpServletRequest request) {
      super(request);
    }

    private static boolean keepAsIs(String name) {
      return name.toLowerCase(java.util.Locale.ROOT).contains("password");
    }

    private static String trim(String value) {
      return value == null ? null : value.strip(); // strip(): Unicode whitespace too (a copied non-breaking space)
    }

    @Override
    public String getParameter(String name) {
      String value = super.getParameter(name);
      return keepAsIs(name) ? value : trim(value);
    }

    @Override
    public String[] getParameterValues(String name) {
      String[] values = super.getParameterValues(name);
      if (values == null || keepAsIs(name)) return values;
      return Arrays.stream(values).map(TrimmedParametersRequest::trim).toArray(String[]::new);
    }

    @Override
    public Map<String, String[]> getParameterMap() {
      Map<String, String[]> trimmed = new LinkedHashMap<>();
      super.getParameterMap().forEach((name, values) -> trimmed.put(name, getParameterValues(name)));
      return Collections.unmodifiableMap(trimmed); // the spec says the map is immutable: keep that promise
    }
  }
}
