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
import org.hibernate.annotations.CreationTimestamp;

/**
 * PROVIDED: a comment on a task (V1: comments, body up to 1000 characters). The body is stored EXACTLY as typed,
 * HTML included: it's escaped when it's rendered (<c:out> in JSP, text nodes in React).
 */
@Entity
@Table(name = "comments")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Comment {

  public static final int MAX_BODY_LENGTH = 1000;

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;
  @Column(name = "task_id")
  private long taskId;
  @Column(name = "author_id")
  private long authorId;
  private String body;
  @CreationTimestamp
  @Column(name = "created_at", updatable = false)
  private Instant createdAt;

  public Comment(long taskId, long authorId, String body) {
    this.taskId = taskId;
    this.authorId = authorId;
    this.body = body;
  }
}
