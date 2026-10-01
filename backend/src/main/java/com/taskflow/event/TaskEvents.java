package com.taskflow.event;

import com.taskflow.entity.TaskStatus;

/**
 * DOMAIN EVENTS: what happened to a task, published by TaskService with Spring's ApplicationEventPublisher.
 * TaskService doesn't know who listens; listeners subscribe by the event's TYPE:
 *   ActivityRecorder        @EventListener                       → the activity feed, in the SAME transaction
 *   NotificationDispatcher  @TransactionalEventListener(AFTER_COMMIT) → notifications + live push, only if it committed
 * Adding a third reaction (an e-mail, a webhook) means adding a listener, not editing TaskService.
 */
public final class TaskEvents {

  private TaskEvents() {}

  public record Created(TaskRef task, long actorId) {}

  public record Updated(TaskRef task, long actorId) {}

  public record StatusChanged(TaskRef task, long actorId, TaskStatus from, TaskStatus to) {}

  public record Assigned(TaskRef task, long actorId, Long previousAssigneeId) {}

  public record Deleted(TaskRef task, long actorId) {}
}
