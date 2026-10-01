package com.taskflow.entity;

/** Why someone is notified. The SPA turns the type + subject into a translated sentence (notifications.<TYPE>). */
public enum NotificationType {
  TASK_ASSIGNED,
  TASK_STATUS_CHANGED,
  TASK_DELETED,
  COMMENT_ADDED,
  PROJECT_INVITED,
  PROJECT_REMOVED
}
