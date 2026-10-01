package com.taskflow.web.filter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletRequestWrapper;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.Arrays;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.Locale;
import java.util.Map;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

/**
 * A request WRAPPER: every form value arrives without leading/trailing whitespace, whichever controller reads it.
 * "alice " at the login form, " Buy milk" in a title, "12 " as an id: normalised once, here.
 *   HttpServletRequestWrapper: every method delegates to the real request; we override only the parameter methods.
 *   Spring MVC's data binding and Spring Security's login filter call getParameter… and simply see trimmed values.
 *   PASSWORDS ARE NOT TRIMMED: a space can be part of a password.
 * Ordered right after Spring Boot's CharacterEncodingFilter: the charset must be set before the first getParameter.
 */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE + 20)
public class ParameterTrimmingFilter extends OncePerRequestFilter {

  @Override
  protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
      throws ServletException, IOException {
    chain.doFilter(new TrimmedParametersRequest(request), response);
  }

  static final class TrimmedParametersRequest extends HttpServletRequestWrapper {

    TrimmedParametersRequest(HttpServletRequest request) {
      super(request);
    }

    private static boolean keepAsIs(String name) {
      return name.toLowerCase(Locale.ROOT).contains("password");
    }

    private static String trim(String value) {
      return value == null ? null : value.strip();   // strip(): Unicode whitespace too (a copied non-breaking space)
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
      return Collections.unmodifiableMap(trimmed);   // the spec says the map is immutable: keep that promise
    }
  }
}
