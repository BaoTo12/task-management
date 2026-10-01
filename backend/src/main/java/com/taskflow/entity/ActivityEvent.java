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

/** PROVIDED: one entry of the activity feed (V5: activity_events). History: never updated. */
@Entity
@Table(name = "activity_events")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class ActivityEvent {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;
  @Column(name = "actor_id")
  private Long actorId;
  @Enumerated(EnumType.STRING)
  private ActivityType type;
  @Column(name = "task_id")
  private Long taskId;
  @Column(name = "project_id")
  private Long projectId;
  private String subject;
  private String details = "";
  @CreationTimestamp
  @Column(name = "created_at", updatable = false)
  private Instant createdAt;

  @Builder
  private ActivityEvent(Long actorId, ActivityType type, Long taskId, Long projectId, String subject, String details) {
    this.actorId = actorId;
    this.type = type;
    this.taskId = taskId;
    this.projectId = projectId;
    this.subject = subject == null ? "" : subject.substring(0, Math.min(200, subject.length()));
    this.details = details == null ? "" : details;
  }
}
