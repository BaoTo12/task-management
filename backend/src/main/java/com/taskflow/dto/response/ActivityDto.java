package com.taskflow.dto.response;

import com.taskflow.entity.ActivityEvent;
import com.taskflow.entity.ActivityType;
import java.time.Instant;

public record ActivityDto(long id, Long actorId, ActivityType type, Long taskId, Long projectId, String subject,
                          String details, Instant createdAt) {

  public static ActivityDto from(ActivityEvent a) {
    return new ActivityDto(a.getId(), a.getActorId(), a.getType(), a.getTaskId(), a.getProjectId(), a.getSubject(),
        a.getDetails(), a.getCreatedAt());
  }
}
