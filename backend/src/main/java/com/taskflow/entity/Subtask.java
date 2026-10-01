package com.taskflow.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

/** PROVIDED: one checklist item inside a task (V4: subtasks). `position` orders the checklist. */
@Entity
@Table(name = "subtasks")
@Getter
@Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Subtask {

  public static final int TITLE_MAX = 200;

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  @Setter(AccessLevel.NONE)
  private Long id;
  @Column(name = "task_id", updatable = false)
  @Setter(AccessLevel.NONE)
  private long taskId;
  private String title;
  private boolean done;
  private int position;
  @CreationTimestamp
  @Column(name = "created_at", updatable = false)
  @Setter(AccessLevel.NONE)
  private Instant createdAt;

  public Subtask(long taskId, String title, int position) {
    this.taskId = taskId;
    this.title = title;
    this.position = position;
  }
}
