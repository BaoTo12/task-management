package com.taskflow.web.support;

import java.io.Serial;
import java.io.Serializable;
import java.util.ArrayList;
import java.util.List;
import org.springframework.stereotype.Component;
import org.springframework.web.context.annotation.SessionScope;

/**
 * The last 5 tasks THIS user opened, as a SESSION-SCOPED bean: Spring creates one instance per HTTP session and stores
 * it IN the session (attribute "scopedTarget.recentTasks"). Controllers inject it like any singleton; what they get is
 * a PROXY that finds the current session's instance on every call. (The servlet era did this by hand with
 * session.getAttribute/setAttribute.)
 * Serializable: sessions may be written to disk. Only ids are kept: small, and never stale (titles are looked up when
 * shown). synchronized: two requests of the same session can run at the same time (two tabs).
 */
@Component
@SessionScope
public class RecentTasks implements Serializable {

  @Serial
  private static final long serialVersionUID = 1L;
  private static final int MAX = 5;

  private final List<Long> ids = new ArrayList<>();

  public synchronized void record(long taskId) {
    ids.remove(Long.valueOf(taskId));   // remove(Object): the id. remove(int) would remove by INDEX
    ids.add(0, taskId);
    if (ids.size() > MAX) ids.subList(MAX, ids.size()).clear();
  }

  /** Most recent first, a copy. */
  public synchronized List<Long> ids() {
    return List.copyOf(ids);
  }
}
