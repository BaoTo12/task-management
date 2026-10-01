package com.taskflow.dto.response;

import com.taskflow.entity.Notification;
import com.taskflow.entity.NotificationType;
import java.time.Instant;

/** One inbox item. The SPA renders "notifications.<type>" with the actor's name and the subject. */
public record NotificationDto(long id, NotificationType type, Long actorId, Long taskId, Long projectId, String subject,
                              boolean read, Instant createdAt) {

  public static NotificationDto from(Notification n) {
    return new NotificationDto(n.getId(), n.getType(), n.getActorId(), n.getTaskId(), n.getProjectId(), n.getSubject(),
        n.isRead(), n.getCreatedAt());
  }
}
