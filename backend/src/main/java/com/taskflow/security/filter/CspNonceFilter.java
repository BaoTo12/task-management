package com.taskflow.security.filter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.security.SecureRandom;
import java.util.Base64;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

/**
 * The Content-Security-Policy, with a per-request NONCE. Scripts and styles come only from 'self', plus elements that
 * carry this response's nonce: a React island's entry script, and the <style> elements styled-components inserts (it
 * reads the nonce from <meta property="csp-nonce">). A new random value per response, so injected markup can't know it.
 * Exposed to JSPs as ${cspNonce}. No 'unsafe-inline': inline <script> and style="…" attributes are refused.
 *
 * A plain servlet filter (a @Component Filter is registered by Spring Boot automatically), ordered BEFORE Spring
 * Security: even a 401 or 403 that Spring Security answers carries the policy. The other security headers are
 * Spring Security's (SecurityConfig.securityHeaders).
 */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE + 10)
public class CspNonceFilter extends OncePerRequestFilter {

  public static final String NONCE_ATTRIBUTE = "cspNonce";
  private static final SecureRandom RANDOM = new SecureRandom();

  static String policy(String nonce) {
    return String.join("; ",
        "default-src 'self'",
        "script-src 'self' 'nonce-" + nonce + "'",
        "style-src 'self' 'nonce-" + nonce + "'",
        "img-src 'self' data:",
        "connect-src 'self'",                       // fetch/XHR/EventSource (the notification stream) to our origin only
        "object-src 'none'",
        "base-uri 'self'",
        "form-action 'self'",
        "frame-ancestors 'none'");
  }

  @Override
  protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
      throws ServletException, IOException {
    byte[] bytes = new byte[18];
    RANDOM.nextBytes(bytes);
    String nonce = Base64.getEncoder().encodeToString(bytes);      // 24 characters, no padding for 18 bytes
    request.setAttribute(NONCE_ATTRIBUTE, nonce);                   // survives the error dispatch: same request object
    response.setHeader("Content-Security-Policy", policy(nonce));
    chain.doFilter(request, response);
  }
}
