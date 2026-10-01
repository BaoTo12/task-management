package com.taskflow.service;

import com.taskflow.entity.Task;
import com.taskflow.entity.TimeEntry;
import com.taskflow.event.TaskRef;
import com.taskflow.event.WorkEvents;
import com.taskflow.exception.FieldValidationException;
import com.taskflow.exception.ForbiddenException;
import com.taskflow.exception.NotFoundException;
import com.taskflow.repository.TaskRepository;
import com.taskflow.repository.TimeEntryRepository;
import com.taskflow.security.AuthUser;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Time tracking. Two ways to log time on a task you can edit:
 *   a TIMER   start → (work) → stop. At most ONE running timer per user: starting a new one stops the old one.
 *   by HAND   "from 09:00 to 10:30" for work done earlier.
 */
@Service
@Transactional(readOnly = true)
@RequiredArgsConstructor
public class TimeTrackingService {

  public static final Duration MAX_ENTRY = Duration.ofHours(24);

  private final TaskService tasks;
  private final TimeEntryRepository entries;
  private final TaskRepository taskRepository;
  private final ApplicationEventPublisher events;
  private final Clock clock;

  public List<TimeEntry> entries(long taskId, AuthUser caller) {
    tasks.requireVisible(taskId, caller);
    return entries.findByTaskIdOrderByStartedAtDesc(taskId);
  }

  public Optional<TimeEntry> running(AuthUser caller) {
    return entries.findFirstByUserIdAndEndedAtIsNull(caller.getId());
  }

  @Transactional
  public TimeEntry start(long taskId, AuthUser caller) {
    tasks.requireEditable(taskId, caller);
    running(caller).ifPresent(this::finish);                     // one running timer per user
    return entries.save(new TimeEntry(taskId, caller.getId(), clock.instant(), null, ""));
  }

  /** NotFoundException when no timer is running. */
  @Transactional
  public TimeEntry stop(AuthUser caller) {
    TimeEntry entry = running(caller).orElseThrow(() -> new NotFoundException("No timer is running"));
    finish(entry);
    return entry;
  }

  @Transactional
  public TimeEntry log(long taskId, AuthUser caller, Instant startedAt, Instant endedAt, String note) {
    Task task = tasks.requireEditable(taskId, caller);
    if (!endedAt.isAfter(startedAt)) throw FieldValidationException.of("endedAt", "must be after startedAt");
    if (endedAt.isAfter(clock.instant())) throw FieldValidationException.of("endedAt", "must not be in the future");
    if (Duration.between(startedAt, endedAt).compareTo(MAX_ENTRY) > 0) {
      throw FieldValidationException.of("endedAt", "an entry can be at most 24 hours long");
    }
    TimeEntry saved = entries.save(new TimeEntry(taskId, caller.getId(), startedAt, endedAt, note));
    events.publishEvent(new WorkEvents.TimeLogged(TaskRef.of(task), caller.getId(), saved.minutes(endedAt)));
    return saved;
  }

  /** Your own entries only (an admin may delete any). */
  @Transactional
  public void delete(long entryId, AuthUser caller) {
    TimeEntry entry = entries.findById(entryId).orElseThrow(() -> new NotFoundException("Time entry not found"));
    if (!caller.isAdmin() && entry.getUserId() != caller.getId()) throw new ForbiddenException("delete time entry " + entryId);
    entries.delete(entry);
  }

  /** Total minutes on a task, a running timer counted up to now. */
  public long totalMinutes(List<TimeEntry> list) {
    Instant now = clock.instant();
    return list.stream().mapToLong(e -> e.minutes(now)).sum();
  }

  private void finish(TimeEntry entry) {
    Instant now = clock.instant();
    entry.stop(now);
    taskRepository.findById(entry.getTaskId())   // no access check: the entry's owner already passed it at start()
        .ifPresent(task -> events.publishEvent(
            new WorkEvents.TimeLogged(TaskRef.of(task), entry.getUserId(), entry.minutes(now))));
  }
}
