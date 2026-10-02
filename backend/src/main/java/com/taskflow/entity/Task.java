package com.taskflow.entity;

import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.Table;
import java.time.Instant;
import java.time.LocalDate;
import java.util.LinkedHashSet;
import java.util.Set;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.Formula;
import org.hibernate.annotations.UpdateTimestamp;

/**
 * PROVIDED: a task (V1 + V3: tasks). A JavaBean for JSP's Expression Language (${task.title} → getTitle()) and a JPA
 * entity. References to other rows are plain ids (categoryId, projectId, assigneeId), not @ManyToOne associations:
 * nothing is loaded lazily behind your back, and the service decides what else a page needs.
 * The labels are the exception: a Set<Long> from the task_labels join table (@ElementCollection), loaded with the task.
 *
 * Lombok: @Getter/@Setter on the class, then @Setter(NONE) on the fields nobody may set (the database or Hibernate
 * fills them in).
 */
@Entity
@Table(name = "tasks")
@Getter
@Setter
@NoArgsConstructor
public class Task {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)    // MySQL AUTO_INCREMENT chooses the id on INSERT
  @Setter(AccessLevel.NONE)
  private Long id;
  private String title;
  private String description = "";
  @Enumerated(EnumType.STRING)                           // stored as 'TODO', never as an ordinal number
  private TaskStatus status = TaskStatus.TODO;
  @Enumerated(EnumType.STRING)
  private Priority priority = Priority.MEDIUM;
  @Column(name = "due_date")
  private LocalDate dueDate;
  /**
   * 1 when there's no due date, else 0: a read-only column computed by the database (@Formula), used ONLY to sort.
   * Spring Data's Criteria queries can't say "NULLS LAST", so TaskSort.DUE sorts by this first instead.
   */
  @Formula("(case when due_date is null then 1 else 0 end)")
  @Getter(AccessLevel.NONE)
  @Setter(AccessLevel.NONE)
  private int dueDateMissing;
  @Column(name = "category_id")
  private Long categoryId;
  @Column(name = "project_id")
  private Long projectId;
  @Column(name = "owner_id", updatable = false)          // the owner never changes after creation
  private long ownerId;
  @Column(name = "assignee_id")
  private Long assigneeId;
  @CreationTimestamp
  @Column(name = "created_at", updatable = false)
  @Setter(AccessLevel.NONE)
  private Instant createdAt;
  @UpdateTimestamp
  @Column(name = "updated_at")
  @Setter(AccessLevel.NONE)
  private Instant updatedAt;
  @Column(name = "completed_at")
  @Setter(AccessLevel.NONE)                               // only syncCompletion() changes it
  private Instant completedAt;
  @ElementCollection(fetch = FetchType.EAGER)            // batched: hibernate.default_batch_fetch_size
  @CollectionTable(name = "task_labels", joinColumns = @JoinColumn(name = "task_id"))
  @Column(name = "label_id")
  @Setter(AccessLevel.NONE)                               // replaceLabels() keeps the SAME collection Hibernate tracks
  private Set<Long> labelIds = new LinkedHashSet<>();

  /**
   * completedAt follows the status: set when the task becomes DONE (kept if it already was), cleared when it's reopened.
   * The service calls it before every save, so no caller can forget it. The reports count completions by completedAt.
   */
  public void syncCompletion(Instant now) {
    if (status != TaskStatus.DONE) completedAt = null;
    else if (completedAt == null) completedAt = now;
  }

  public void replaceLabels(Set<Long> ids) {
    labelIds.clear();
    labelIds.addAll(ids);
  }

  /** Convenience for views: is it done? (EL reads it as ${task.done}.) */
  public boolean isDone() {
    return status == TaskStatus.DONE;
  }

  /**
   * The "overdue" rule, ONCE, in the model. "today" is a parameter, so it's testable and the caller chooses the clock.
   * Not a bean property (it takes an argument): a view calls it as a METHOD, ${task.isOverdue(today)}.
   */
  public boolean isOverdue(LocalDate today) {
    return !isDone() && dueDate != null && dueDate.isBefore(today);
  }
}
