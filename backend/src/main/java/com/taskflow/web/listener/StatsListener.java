package com.taskflow.web.listener;

import jakarta.servlet.ServletRequestEvent;
import jakarta.servlet.ServletRequestListener;
import jakarta.servlet.http.HttpSessionEvent;
import jakarta.servlet.http.HttpSessionListener;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

/**
 * SERVLET listeners, still: the container calls these for EVERY request and EVERY session, on whichever thread handles
 * them. A Spring bean implementing a servlet listener interface is registered with the container by Spring Boot, and,
 * unlike a @WebListener created by Tomcat, it can have dependencies injected (AppStats).
 */
@Component
@RequiredArgsConstructor
public class StatsListener implements ServletRequestListener, HttpSessionListener {

  private final AppStats stats;

  @Override
  public void requestInitialized(ServletRequestEvent event) {
    stats.requestStarted();
  }

  @Override
  public void sessionCreated(HttpSessionEvent event) {
    stats.sessionCreated();
  }

  @Override
  public void sessionDestroyed(HttpSessionEvent event) {   // invalidate() or the 15-minute timeout
    stats.sessionDestroyed();
  }
}
