package com.taskflow.event.listener;

import com.taskflow.entity.ActivityEvent;
import com.taskflow.entity.ActivityType;
import com.taskflow.event.ProjectEvents;
import com.taskflow.event.TaskEvents;
import com.taskflow.event.TaskRef;
import com.taskflow.event.WorkEvents;
import com.taskflow.repository.ActivityRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

/**
 * Writes the activity feed from domain events. A plain @EventListener runs SYNCHRONOUSLY, inside the publisher's
 * transaction: the feed entry and the change commit together, or roll back together (compare NotificationDispatcher,
 * which waits for the commit).
 */
@Component
@RequiredArgsConstructor
public class ActivityRecorder {

  private final ActivityRepository activity;

  @EventListener
  public void on(TaskEvents.Created event) {
    record(event.actorId(), ActivityType.TASK_CREATED, event.task(), "");
  }

  @EventListener
  public void on(TaskEvents.StatusChanged event) {
    record(event.actorId(), ActivityType.TASK_STATUS_CHANGED, event.task(), event.from() + "→" + event.to());
  }

  @EventListener
  public void on(TaskEvents.Assigned event) {
    record(event.actorId(), ActivityType.TASK_ASSIGNED, event.task(), String.valueOf(event.task().assigneeId()));
  }

  @EventListener
  public void on(TaskEvents.Deleted event) {
    record(event.actorId(), ActivityType.TASK_DELETED, event.task(), "");
  }

  @EventListener
  public void on(WorkEvents.CommentAdded event) {
    record(event.actorId(), ActivityType.COMMENT_ADDED, event.task(), "");
  }

  @EventListener
  public void on(WorkEvents.SubtaskCompleted event) {
    record(event.actorId(), ActivityType.SUBTASK_COMPLETED, event.task(), event.subtaskTitle());
  }

  @EventListener
  public void on(WorkEvents.TimeLogged event) {
    record(event.actorId(), ActivityType.TIME_LOGGED, event.task(), event.minutes() + "m");
  }

  @EventListener
  public void on(ProjectEvents.Created event) {
    project(event.actorId(), ActivityType.PROJECT_CREATED, event.projectId(), event.name(), "");
  }

  @EventListener
  public void on(ProjectEvents.Updated event) {
    project(event.actorId(), ActivityType.PROJECT_UPDATED, event.projectId(), event.name(), "");
  }

  @EventListener
  public void on(ProjectEvents.MemberAdded event) {
    project(event.actorId(), ActivityType.MEMBER_ADDED, event.projectId(), event.projectName(),
        event.username() + ":" + event.role());
  }

  @EventListener
  public void on(ProjectEvents.MemberRoleChanged event) {
    project(event.actorId(), ActivityType.MEMBER_ADDED, event.projectId(), event.projectName(),
        event.username() + ":" + event.role());
  }

  @EventListener
  public void on(ProjectEvents.MemberRemoved event) {
    project(event.actorId(), ActivityType.MEMBER_REMOVED, event.projectId(), event.projectName(), event.username());
  }

  // TaskEvents.Updated is deliberately NOT recorded: every save would flood the feed; the specific events say more.

  private void record(long actorId, ActivityType type, TaskRef task, String details) {
    activity.save(ActivityEvent.builder()
        .actorId(actorId).type(type).taskId(task.id()).projectId(task.projectId()).subject(task.title()).details(details)
        .build());
  }

  private void project(long actorId, ActivityType type, long projectId, String name, String details) {
    activity.save(ActivityEvent.builder()
        .actorId(actorId).type(type).projectId(projectId).subject(name).details(details)
        .build());
  }
}
