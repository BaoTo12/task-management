package com.taskflow.event.listener;

import com.taskflow.entity.NotificationType;
import com.taskflow.event.ProjectEvents;
import com.taskflow.event.TaskEvents;
import com.taskflow.event.TaskRef;
import com.taskflow.event.WorkEvents;
import com.taskflow.service.NotificationService;
import java.util.LinkedHashSet;
import java.util.Set;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.event.TransactionalEventListener;

/**
 * Who gets a notification for what. Reacts to domain events AFTER the change committed (@TransactionalEventListener,
 * phase AFTER_COMMIT by default): a rolled-back change notifies nobody.
 * After the commit there is no transaction any more, so writing the notifications needs a NEW one:
 * @Transactional(REQUIRES_NEW) (Spring refuses any other propagation on a transactional event listener).
 *
 *   TASK_ASSIGNED         the new assignee
 *   TASK_STATUS_CHANGED   the owner and the assignee
 *   COMMENT_ADDED         the owner and the assignee
 *   TASK_DELETED          the assignee
 *   PROJECT_INVITED       the added member          PROJECT_REMOVED   the removed member
 * Never the person who did it (NotificationService.deliver skips them).
 */
@Component
@RequiredArgsConstructor
public class NotificationDispatcher {

  private final NotificationService notifications;

  @TransactionalEventListener
  @Transactional(propagation = Propagation.REQUIRES_NEW)
  public void on(TaskEvents.Assigned event) {
    TaskRef task = event.task();
    if (task.assigneeId() != null) notify(task.assigneeId(), NotificationType.TASK_ASSIGNED, event.actorId(), task);
  }

  @TransactionalEventListener
  @Transactional(propagation = Propagation.REQUIRES_NEW)
  public void on(TaskEvents.StatusChanged event) {
    for (long recipient : ownerAndAssignee(event.task())) {
      notify(recipient, NotificationType.TASK_STATUS_CHANGED, event.actorId(), event.task());
    }
  }

  @TransactionalEventListener
  @Transactional(propagation = Propagation.REQUIRES_NEW)
  public void on(TaskEvents.Deleted event) {
    TaskRef task = event.task();
    if (task.assigneeId() != null) notify(task.assigneeId(), NotificationType.TASK_DELETED, event.actorId(), task);
  }

  @TransactionalEventListener
  @Transactional(propagation = Propagation.REQUIRES_NEW)
  public void on(WorkEvents.CommentAdded event) {
    for (long recipient : ownerAndAssignee(event.task())) {
      notify(recipient, NotificationType.COMMENT_ADDED, event.actorId(), event.task());
    }
  }

  @TransactionalEventListener
  @Transactional(propagation = Propagation.REQUIRES_NEW)
  public void on(ProjectEvents.MemberAdded event) {
    notifications.deliver(event.userId(), NotificationType.PROJECT_INVITED, event.actorId(), null, event.projectId(),
        event.projectName());
  }

  @TransactionalEventListener
  @Transactional(propagation = Propagation.REQUIRES_NEW)
  public void on(ProjectEvents.MemberRemoved event) {
    notifications.deliver(event.userId(), NotificationType.PROJECT_REMOVED, event.actorId(), null, event.projectId(),
        event.projectName());
  }

  private void notify(long recipient, NotificationType type, long actorId, TaskRef task) {
    notifications.deliver(recipient, type, actorId, task.id(), task.projectId(), task.title());
  }

  private static Set<Long> ownerAndAssignee(TaskRef task) {
    Set<Long> recipients = new LinkedHashSet<>();              // a Set: the owner may also be the assignee
    recipients.add(task.ownerId());
    if (task.assigneeId() != null) recipients.add(task.assigneeId());
    return recipients;
  }
}
