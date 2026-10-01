package com.taskflow.event;

import com.taskflow.entity.Task;

/**
 * A task as EVENTS carry it: plain values, copied at the moment of the change. Never the entity itself: listeners that
 * run after the commit (NotificationDispatcher) would hold a detached object whose state may have moved on.
 */
public record TaskRef(long id, String title, Long projectId, long ownerId, Long assigneeId) {

  public static TaskRef of(Task task) {
    return new TaskRef(task.getId(), task.getTitle(), task.getProjectId(), task.getOwnerId(), task.getAssigneeId());
  }
}
