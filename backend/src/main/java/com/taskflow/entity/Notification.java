package com.taskflow.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

/**
 * PROVIDED: one item of a user's inbox (V5: notifications). readAt == null means unread.
 * @Builder: six optional-ish fields make a constructor call unreadable; a builder names them:
 *   Notification.builder().userId(1).type(TASK_ASSIGNED).actorId(2).taskId(9).subject("…").build()
 * Lombok's @Builder needs an all-args constructor: the private one below (only the builder uses it).
 */
@Entity
@Table(name = "notifications")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Notification {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;
  @Column(name = "user_id", updatable = false)
  private long userId;
  @Enumerated(EnumType.STRING)
  private NotificationType type;
  @Column(name = "actor_id")
  private Long actorId;
  @Column(name = "task_id")
  private Long taskId;
  @Column(name = "project_id")
  private Long projectId;
  private String subject;
  @Column(name = "read_at")
  private Instant readAt;
  @CreationTimestamp
  @Column(name = "created_at", updatable = false)
  private Instant createdAt;

  @Builder
  private Notification(long userId, NotificationType type, Long actorId, Long taskId, Long projectId, String subject) {
    this.userId = userId;
    this.type = type;
    this.actorId = actorId;
    this.taskId = taskId;
    this.projectId = projectId;
    this.subject = subject;
  }

  public boolean isRead() {
    return readAt != null;
  }

  public void markRead(Instant now) {
    if (readAt == null) readAt = now;
  }
}
