package com.taskflow.entity;

/** What an activity-feed entry says happened. `details` adds the specifics ("TODO→DONE", "carol:MAINTAINER"). */
public enum ActivityType {
  TASK_CREATED,
  TASK_UPDATED,
  TASK_STATUS_CHANGED,
  TASK_ASSIGNED,
  TASK_DELETED,
  COMMENT_ADDED,
  SUBTASK_COMPLETED,
  TIME_LOGGED,
  PROJECT_CREATED,
  PROJECT_UPDATED,
  MEMBER_ADDED,
  MEMBER_REMOVED
}
