package com.taskflow.web.listener;

import com.taskflow.security.AuthUser;
import com.taskflow.security.SessionKeys;
import com.taskflow.service.AuditService;
import jakarta.servlet.http.HttpSession;
import jakarta.servlet.http.HttpSessionAttributeListener;
import jakarta.servlet.http.HttpSessionBindingEvent;
import jakarta.servlet.http.HttpSessionEvent;
import jakarta.servlet.http.HttpSessionIdListener;
import jakarta.servlet.http.HttpSessionListener;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.stereotype.Component;

/**
 * Who is logged in RIGHT NOW, and an audit event when a logged-in session simply times out.
 * Three listener interfaces, one bean. Spring Security keeps the login in the session attribute SPRING_SECURITY_CONTEXT:
 *   attributeAdded/Replaced  → login (or a role change): remember sessionId → username
 *   attributeRemoved         → logout (AuditLogoutHandler removes it BEFORE the session is invalidated): forget it
 *   sessionIdChanged         → changeSessionId() at login (session fixation protection): move the entry
 *   sessionDestroyed with a user still in → nobody logged out: the timeout → SESSION_EXPIRED
 * Listener methods run on request threads and on Tomcat's background expiry thread at the same time: the map is a
 * ConcurrentHashMap, and nothing else is shared.
 */
@Component
@RequiredArgsConstructor
public class SessionRegistry implements HttpSessionListener, HttpSessionAttributeListener, HttpSessionIdListener {

  private final AuditService audit;
  private final Map<String, String> usernamesBySession = new ConcurrentHashMap<>();

  /** The distinct usernames with at least one live session, sorted. */
  public List<String> loggedInUsers() {
    return usernamesBySession.values().stream().distinct().sorted().toList();
  }

  public int loggedInSessions() {
    return usernamesBySession.size();
  }

  @Override
  public void attributeAdded(HttpSessionBindingEvent event) {
    remember(event);
  }

  @Override
  public void attributeReplaced(HttpSessionBindingEvent event) {   // getValue() is the OLD value here; read the new one
    remember(event);
  }

  @Override
  public void attributeRemoved(HttpSessionBindingEvent event) {
    if (isLogin(event)) usernamesBySession.remove(event.getSession().getId());
  }

  @Override
  public void sessionIdChanged(HttpSessionEvent event, String oldSessionId) {
    String username = usernamesBySession.remove(oldSessionId);
    if (username != null) usernamesBySession.put(event.getSession().getId(), username);
  }

  @Override
  public void sessionDestroyed(HttpSessionEvent event) {           // runs BEFORE the attributes are removed
    HttpSession session = event.getSession();
    String username = usernamesBySession.remove(session.getId());
    if (username != null) {
      Object ip = session.getAttribute(SessionKeys.LOGIN_IP);
      audit.record("SESSION_EXPIRED", username, ip == null ? "unknown" : ip.toString(), null);
    }
  }

  private void remember(HttpSessionBindingEvent event) {
    if (!isLogin(event)) return;
    Object value = event.getSession().getAttribute(SessionKeys.SECURITY_CONTEXT);
    if (value instanceof SecurityContext context && context.getAuthentication() != null
        && context.getAuthentication().getPrincipal() instanceof AuthUser user) {
      usernamesBySession.put(event.getSession().getId(), user.getUsername());
    }
  }

  private static boolean isLogin(HttpSessionBindingEvent event) {
    return SessionKeys.SECURITY_CONTEXT.equals(event.getName());
  }
}
