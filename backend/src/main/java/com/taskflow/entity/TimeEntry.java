package com.taskflow.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Duration;
import java.time.Instant;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * PROVIDED: one work session on a task (V4: time_entries). endedAt == null means the timer is RUNNING.
 * Changed only through stop(): an entry's start, task and user never change.
 */
@Entity
@Table(name = "time_entries")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class TimeEntry {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;
  @Column(name = "task_id", updatable = false)
  private long taskId;
  @Column(name = "user_id", updatable = false)
  private long userId;
  @Column(name = "started_at", updatable = false)
  private Instant startedAt;
  @Column(name = "ended_at")
  private Instant endedAt;
  private String note = "";

  public TimeEntry(long taskId, long userId, Instant startedAt, Instant endedAt, String note) {
    this.taskId = taskId;
    this.userId = userId;
    this.startedAt = startedAt;
    this.endedAt = endedAt;
    this.note = note == null ? "" : note;
  }

  public boolean isRunning() {
    return endedAt == null;
  }

  public void stop(Instant now) {
    if (endedAt == null) endedAt = now;
  }

  /** Whole minutes worked; a running entry counts up to `now`. */
  public long minutes(Instant now) {
    return Duration.between(startedAt, endedAt == null ? now : endedAt).toMinutes();
  }
}
