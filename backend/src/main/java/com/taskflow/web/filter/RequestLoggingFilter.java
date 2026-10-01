package com.taskflow.web.filter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.concurrent.ThreadLocalRandom;
import java.util.regex.Pattern;
import lombok.extern.slf4j.Slf4j;
import org.slf4j.MDC;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

/**
 * One log line per request: method, URI, status, duration, and a request id.
 *   BEFORE the chain: start the clock, choose the id, put it in the MDC (every log line of this request, from any class,
 *   prints it: logback's %X{requestId}) and in an X-Request-Id response header (a user can quote it in a bug report).
 *   AFTER the chain: the controller and the view are done; the status is known. Log it.
 * The client's own X-Request-Id is adopted if it's a well-formed UUID (TaskFlow Web sends one per call), so the browser's
 * Network tab and the server's log show the SAME id; anything else could inject fake lines into the log.
 * @Component + @Order: Spring Boot registers it as a servlet filter, outermost (it measures everything else).
 * @Slf4j: Lombok writes `private static final Logger log = LoggerFactory.getLogger(RequestLoggingFilter.class)`.
 */
@Slf4j
@Component
@Order(Ordered.HIGHEST_PRECEDENCE + 1)
public class RequestLoggingFilter extends OncePerRequestFilter {

  private static final Pattern UUID = Pattern.compile("[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}");

  @Override
  protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
      throws ServletException, IOException {
    String requestId = incomingId(request);
    long start = System.nanoTime();
    MDC.put("requestId", requestId);
    response.setHeader("X-Request-Id", requestId);
    request.setAttribute("requestId", requestId);    // for the 500 page's reference, rendered after we return
    int status = 500;                                // what the client gets if an exception escapes
    try {
      chain.doFilter(request, response);
      status = response.getStatus();
    } finally {
      long millis = (System.nanoTime() - start) / 1_000_000;
      String query = request.getQueryString();
      log.info("{} {}{} {} {}ms", request.getMethod(), request.getRequestURI(), query == null ? "" : "?" + query, status, millis);
      MDC.remove("requestId");                       // threads are reused: never leave data for the next request
    }
  }

  private static String incomingId(HttpServletRequest request) {
    String sent = request.getHeader("X-Request-Id");
    if (sent != null && UUID.matcher(sent).matches()) return sent;
    return Long.toHexString(ThreadLocalRandom.current().nextLong());
  }
}
