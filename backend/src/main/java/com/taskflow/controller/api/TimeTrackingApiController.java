package com.taskflow.controller.api;

import com.taskflow.dto.request.TimeEntryRequest;
import com.taskflow.dto.response.TimeEntryDto;
import com.taskflow.security.AuthUser;
import com.taskflow.service.TimeTrackingService;
import jakarta.validation.Valid;
import java.time.Clock;
import java.time.Instant;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

/**
 *   GET    /api/tasks/{taskId}/time-entries   → [TimeEntryDto], newest first
 *   POST   /api/tasks/{taskId}/time-entries   → 201 TimeEntryDto (logged by hand)
 *   POST   /api/tasks/{taskId}/timer/start    → 201 TimeEntryDto (any other running timer of yours is stopped)
 *   GET    /api/timer                         → 200 the running entry | 204 none
 *   POST   /api/timer/stop                    → 200 the stopped entry | 404 none running
 *   DELETE /api/time-entries/{id}             → 204 (your own)
 */
@RestController
@RequiredArgsConstructor
public class TimeTrackingApiController {

  private final TimeTrackingService time;
  private final Clock clock;

  @GetMapping("/api/tasks/{taskId}/time-entries")
  List<TimeEntryDto> entries(@PathVariable long taskId, @AuthenticationPrincipal AuthUser user) {
    Instant now = clock.instant();
    return time.entries(taskId, user).stream().map(e -> TimeEntryDto.from(e, now)).toList();
  }

  @PostMapping("/api/tasks/{taskId}/time-entries")
  @ResponseStatus(HttpStatus.CREATED)
  TimeEntryDto log(@PathVariable long taskId, @Valid @RequestBody TimeEntryRequest body, @AuthenticationPrincipal AuthUser user) {
    String note = body.note() == null ? "" : body.note().strip();
    return TimeEntryDto.from(time.log(taskId, user, body.startedAt(), body.endedAt(), note), clock.instant());
  }

  @PostMapping("/api/tasks/{taskId}/timer/start")
  @ResponseStatus(HttpStatus.CREATED)
  TimeEntryDto start(@PathVariable long taskId, @AuthenticationPrincipal AuthUser user) {
    return TimeEntryDto.from(time.start(taskId, user), clock.instant());
  }

  /** 204 No Content is the honest answer to "is a timer running?" when none is: there is nothing to return. */
  @GetMapping("/api/timer")
  ResponseEntity<TimeEntryDto> running(@AuthenticationPrincipal AuthUser user) {
    return time.running(user)
        .map(entry -> ResponseEntity.ok(TimeEntryDto.from(entry, clock.instant())))
        .orElseGet(() -> ResponseEntity.noContent().build());
  }

  @PostMapping("/api/timer/stop")
  TimeEntryDto stop(@AuthenticationPrincipal AuthUser user) {
    return TimeEntryDto.from(time.stop(user), clock.instant());
  }

  @DeleteMapping("/api/time-entries/{id}")
  ResponseEntity<Void> delete(@PathVariable long id, @AuthenticationPrincipal AuthUser user) {
    time.delete(id, user);
    return ResponseEntity.noContent().build();
  }
}
