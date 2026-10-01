-- V5 · PROVIDED. What happened, and who needs to know:
--   activity_events  a project/task feed: "Carol moved «Prepare sprint demo» to Done" (everyone who can see the task)
--   notifications    a personal inbox: "Alice assigned you «Fix login redirect bug»" (one user, read/unread)
-- Both store the SUBJECT (a task title, a project name) as it was: a feed is history, it doesn't change when a task is renamed.

CREATE TABLE activity_events (
  id         BIGINT       NOT NULL AUTO_INCREMENT PRIMARY KEY,
  actor_id   BIGINT       NULL,                    -- NULL: the system (a scheduled job)
  type       VARCHAR(40)  NOT NULL,                -- ActivityType: TASK_CREATED, TASK_STATUS_CHANGED, …
  task_id    BIGINT       NULL,                    -- NOT foreign keys: the feed keeps "deleted «X»" after X is gone
  project_id BIGINT       NULL,
  subject    VARCHAR(200) NOT NULL,
  details    VARCHAR(500) NOT NULL DEFAULT '',     -- e.g. "TODO→DONE", "MEMBER"
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  INDEX ix_activity_project (project_id, id),
  INDEX ix_activity_task (task_id, id),
  INDEX ix_activity_actor (actor_id, id)
);

CREATE TABLE notifications (
  id         BIGINT       NOT NULL AUTO_INCREMENT PRIMARY KEY,
  user_id    BIGINT       NOT NULL,                -- the recipient
  type       VARCHAR(40)  NOT NULL,                -- NotificationType: TASK_ASSIGNED, COMMENT_ADDED, …
  actor_id   BIGINT       NULL,
  task_id    BIGINT       NULL,
  project_id BIGINT       NULL,
  subject    VARCHAR(200) NOT NULL,
  read_at    TIMESTAMP(3) NULL,                    -- NULL = unread
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  CONSTRAINT fk_notifications_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
  INDEX ix_notifications_inbox (user_id, id),      -- newest first, cursor pagination (WHERE id < ?)
  INDEX ix_notifications_unread (user_id, read_at)
);

-- ── Demo data ──────────────────────────────────────────────────────────────────────────────────────────────
INSERT INTO activity_events (actor_id, type, task_id, project_id, subject, details, created_at) VALUES
  (1, 'PROJECT_CREATED', NULL, 1, 'Website relaunch', '', '2026-08-20 09:00:00'),
  (1, 'MEMBER_ADDED', NULL, 1, 'Website relaunch', 'carol:MAINTAINER', '2026-08-20 10:00:00'),
  (1, 'MEMBER_ADDED', NULL, 1, 'Website relaunch', 'bob:MEMBER', '2026-08-21 09:00:00'),
  (2, 'PROJECT_CREATED', NULL, 2, 'Mobile app', '', '2026-08-25 09:00:00'),
  (1, 'TASK_ASSIGNED', 5, 1, 'Prepare sprint demo', '4', '2026-09-20 09:00:00'),
  (4, 'TASK_STATUS_CHANGED', 9, 1, 'Renew SSL certificate', 'TODO→IN_PROGRESS', '2026-09-24 11:00:00'),
  (2, 'COMMENT_ADDED', 6, 1, 'Update dependency versions', '', '2026-09-26 10:50:00'),
  (2, 'TASK_ASSIGNED', 25, 2, 'Bob: refactor payment module', '1', '2026-09-27 08:30:00');

INSERT INTO notifications (user_id, type, actor_id, task_id, project_id, subject, read_at, created_at) VALUES
  (4, 'TASK_ASSIGNED', 1, 5, 1, 'Prepare sprint demo', '2026-09-20 10:00:00', '2026-09-20 09:00:00'),
  (1, 'PROJECT_INVITED', 2, NULL, 2, 'Mobile app', '2026-08-25 11:00:00', '2026-08-25 10:00:00'),
  (1, 'TASK_ASSIGNED', 2, 25, 2, 'Bob: refactor payment module', NULL, '2026-09-27 08:30:00'),
  (1, 'COMMENT_ADDED', 2, 6, 1, 'Update dependency versions', NULL, '2026-09-26 10:50:00'),
  (1, 'TASK_STATUS_CHANGED', 4, 9, 1, 'Renew SSL certificate', NULL, '2026-09-24 11:00:00');
