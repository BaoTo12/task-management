package com.taskflow.web.listener;

import com.taskflow.config.TaskflowProperties;
import com.taskflow.security.AuthUser;
import com.taskflow.security.CurrentUser;
import com.taskflow.service.AuditService;
import jakarta.servlet.ServletRequestEvent;
import jakarta.servlet.ServletRequestListener;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

/**
 * Every request slower than taskflow.slow-request-millis (application.yml, 500) becomes a SLOW_REQUEST audit event:
 * "GET /taskflow/tasks 734ms". Thread-safe by construction: the start time lives in the REQUEST (one per thread), the
 * threshold never changes, and AuditService is itself safe for concurrent use.
 * Note: requestDestroyed runs after Spring Security cleared its ThreadLocal, so the user is usually unknown here;
 * the request id in the log connects the event to the user's log lines.
 */
@Component
@RequiredArgsConstructor
public class SlowRequestListener implements ServletRequestListener {

  private static final String STARTED = SlowRequestListener.class.getName() + ".started";

  private final AuditService audit;
  private final TaskflowProperties properties;

  @Override
  public void requestInitialized(ServletRequestEvent event) {
    event.getServletRequest().setAttribute(STARTED, System.nanoTime());
  }

  @Override
  public void requestDestroyed(ServletRequestEvent event) {
    Object started = event.getServletRequest().getAttribute(STARTED);
    if (!(started instanceof Long start) || !(event.getServletRequest() instanceof HttpServletRequest request)) return;
    long millis = (System.nanoTime() - start) / 1_000_000;
    if (millis < properties.slowRequestMillis()) return;
    if (request.getRequestURI().endsWith("/stream")) return;     // an SSE stream is long on purpose
    AuthUser user = CurrentUser.orNull();
    audit.record("SLOW_REQUEST", user == null ? null : user.getUsername(), request.getRemoteAddr(),
        request.getMethod() + " " + request.getRequestURI() + " " + millis + "ms");
  }
}
