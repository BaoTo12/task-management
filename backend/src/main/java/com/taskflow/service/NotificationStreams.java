package com.taskflow.service;

import java.io.IOException;
import java.time.Duration;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

/**
 * Live notifications with SERVER-SENT EVENTS: GET /api/notifications/stream keeps one HTTP response open per browser
 * tab, and the server writes "event: notification\ndata: {…}\n\n" into it whenever something new arrives.
 * SSE vs WebSocket: one direction (server → browser) is all we need; SSE is plain HTTP (cookies, CSRF-free GET,
 * proxies), and EventSource reconnects by itself.
 *
 * Spring MVC ASYNC underneath: the controller returns the SseEmitter, the request thread goes back to Tomcat's pool,
 * the response stays open. Emitters live here, per user (a user may have several tabs), in a ConcurrentHashMap: they're
 * added by request threads and used by whichever thread commits a change.
 * One server only: with several, a message broker (Redis pub/sub) would have to fan the events out.
 */
@Slf4j
@Component
public class NotificationStreams {

  private static final long TIMEOUT = Duration.ofMinutes(30).toMillis();   // then EventSource reconnects

  private final Map<Long, Set<SseEmitter>> emitters = new ConcurrentHashMap<>();

  public SseEmitter open(long userId) {
    SseEmitter emitter = new SseEmitter(TIMEOUT);
    emitters.computeIfAbsent(userId, id -> ConcurrentHashMap.newKeySet()).add(emitter);
    Runnable remove = () -> remove(userId, emitter);
    emitter.onCompletion(remove);
    emitter.onTimeout(remove);
    emitter.onError(error -> remove.run());
    send(userId, emitter, SseEmitter.event().name("ready").data("ok"));    // tells the client the stream is live
    return emitter;
  }

  public void push(long userId, Object payload) {
    for (SseEmitter emitter : emitters.getOrDefault(userId, Set.of())) {
      send(userId, emitter, SseEmitter.event().name("notification").data(payload));
    }
  }

  /** A comment line every 25 s: proxies close connections that stay silent, and it detects closed tabs. */
  @Scheduled(fixedRate = 25_000)
  void heartbeat() {
    emitters.forEach((userId, set) -> set.forEach(emitter -> send(userId, emitter, SseEmitter.event().comment("ping"))));
  }

  public int openStreams() {
    return emitters.values().stream().mapToInt(Set::size).sum();
  }

  private void send(long userId, SseEmitter emitter, SseEmitter.SseEventBuilder event) {
    try {
      emitter.send(event);
    } catch (IOException | IllegalStateException e) {    // the tab is gone: forget it
      log.debug("SSE stream of user {} closed: {}", userId, e.getMessage());
      remove(userId, emitter);
    }
  }

  private void remove(long userId, SseEmitter emitter) {
    emitters.computeIfPresent(userId, (id, set) -> {
      set.remove(emitter);
      return set.isEmpty() ? null : set;                 // returning null removes the map entry
    });
  }
}
