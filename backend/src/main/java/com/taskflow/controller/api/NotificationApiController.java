package com.taskflow.controller.api;

import com.taskflow.dto.response.CursorPageDto;
import com.taskflow.dto.response.NotificationDto;
import com.taskflow.security.AuthUser;
import com.taskflow.service.NotificationService;
import com.taskflow.service.NotificationStreams;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

/**
 *   GET  /api/notifications?before=&limit=20&unreadOnly=false  → CursorPageDto<NotificationDto> (+ unreadCount)
 *   GET  /api/notifications/unread-count                     → {"count":3}   (polled by the header badge)
 *   GET  /api/notifications/stream                           → text/event-stream, one "notification" event per new item
 *   POST /api/notifications/{id}/read                        → NotificationDto
 *   POST /api/notifications/read-all                         → {"updated":4}
 */
@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationApiController {

  private final NotificationService notifications;
  private final NotificationStreams streams;

  @GetMapping
  CursorPageDto<NotificationDto> inbox(@RequestParam(required = false) @Min(1) Long before,
                                       @RequestParam(defaultValue = "20") @Min(1) @Max(50) int limit,
                                       @RequestParam(defaultValue = "false") boolean unreadOnly,
                                       @AuthenticationPrincipal AuthUser user) {
    return notifications.inbox(user, before, unreadOnly, limit);
  }

  @GetMapping("/unread-count")
  Map<String, Long> unreadCount(@AuthenticationPrincipal AuthUser user) {
    return Map.of("count", notifications.unreadCount(user));
  }

  /** Returning the emitter starts ASYNC processing: this thread returns, the response stays open (NotificationStreams). */
  @GetMapping(path = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
  SseEmitter stream(@AuthenticationPrincipal AuthUser user) {
    return streams.open(user.getId());
  }

  @PostMapping("/{id}/read")
  NotificationDto markRead(@PathVariable long id, @AuthenticationPrincipal AuthUser user) {
    return notifications.markRead(id, user);
  }

  @PostMapping("/read-all")
  Map<String, Integer> markAllRead(@AuthenticationPrincipal AuthUser user) {
    return Map.of("updated", notifications.markAllRead(user));
  }
}
