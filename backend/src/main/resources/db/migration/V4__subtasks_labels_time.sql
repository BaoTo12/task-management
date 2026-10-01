-- V4 · PROVIDED. Inside a task: a checklist (subtasks), labels (many-to-many), and time tracking.

CREATE TABLE subtasks (
  id         BIGINT       NOT NULL AUTO_INCREMENT PRIMARY KEY,
  task_id    BIGINT       NOT NULL,
  title      VARCHAR(200) NOT NULL,
  done       BOOLEAN      NOT NULL DEFAULT FALSE,
  position   INT          NOT NULL DEFAULT 0,       -- the order in the checklist (drag to reorder)
  created_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_subtasks_task FOREIGN KEY (task_id) REFERENCES tasks (id) ON DELETE CASCADE,
  INDEX ix_subtasks_task (task_id, position)
);

-- Labels are shared by everyone (like categories), but a task can have MANY of them: a join table.
CREATE TABLE labels (
  id         BIGINT      NOT NULL AUTO_INCREMENT PRIMARY KEY,
  name       VARCHAR(30) NOT NULL,
  color      CHAR(7)     NOT NULL,
  created_by BIGINT      NULL,
  CONSTRAINT uq_labels_name UNIQUE (name),
  CONSTRAINT fk_labels_creator FOREIGN KEY (created_by) REFERENCES users (id) ON DELETE SET NULL
);

CREATE TABLE task_labels (
  task_id  BIGINT NOT NULL,
  label_id BIGINT NOT NULL,
  PRIMARY KEY (task_id, label_id),
  CONSTRAINT fk_task_labels_task  FOREIGN KEY (task_id)  REFERENCES tasks (id)  ON DELETE CASCADE,
  CONSTRAINT fk_task_labels_label FOREIGN KEY (label_id) REFERENCES labels (id) ON DELETE CASCADE,
  INDEX ix_task_labels_label (label_id)            -- "every task with label X"
);

-- One row per work session. ended_at NULL = the timer is RUNNING (at most one per user: TimeTrackingService).
CREATE TABLE time_entries (
  id         BIGINT       NOT NULL AUTO_INCREMENT PRIMARY KEY,
  task_id    BIGINT       NOT NULL,
  user_id    BIGINT       NOT NULL,
  started_at TIMESTAMP(3) NOT NULL,
  ended_at   TIMESTAMP(3) NULL,
  note       VARCHAR(200) NOT NULL DEFAULT '',
  CONSTRAINT fk_time_task FOREIGN KEY (task_id) REFERENCES tasks (id) ON DELETE CASCADE,
  CONSTRAINT fk_time_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
  INDEX ix_time_task (task_id, started_at),
  INDEX ix_time_user_running (user_id, ended_at)
);

-- ── Demo data ──────────────────────────────────────────────────────────────────────────────────────────────
INSERT INTO subtasks (task_id, title, done, position) VALUES
  (1, 'Collect numbers from finance', TRUE, 0),
  (1, 'Draft the summary', TRUE, 1),
  (1, 'Add the churn chart', FALSE, 2),
  (1, 'Review with the team lead', FALSE, 3),
  (5, 'Pick the three features to show', TRUE, 0),
  (5, 'Record the walkthrough', FALSE, 1),
  (9, 'Generate the CSR', FALSE, 0),
  (9, 'Install on staging', FALSE, 1);

INSERT INTO labels (id, name, color, created_by) VALUES
  (1, 'bug', '#dc2626', 1),
  (2, 'urgent', '#ea580c', 1),
  (3, 'frontend', '#2563eb', 4),
  (4, 'backend', '#7c3aed', 4),
  (5, 'blocked', '#64748b', 2);

INSERT INTO task_labels (task_id, label_id) VALUES
  (2, 1), (2, 3), (9, 2), (9, 4), (13, 4), (18, 4), (18, 2), (5, 3), (25, 4), (25, 5), (15, 2);

INSERT INTO time_entries (task_id, user_id, started_at, ended_at, note) VALUES
  (1, 1, '2026-09-22 08:30:00', '2026-09-22 10:00:00', 'First draft'),
  (1, 1, '2026-09-23 13:00:00', '2026-09-23 14:15:00', ''),
  (2, 1, '2026-09-24 09:00:00', '2026-09-24 11:30:00', 'Reproduced and traced'),
  (5, 4, '2026-09-25 15:00:00', '2026-09-25 16:00:00', 'Outline'),
  (6, 2, '2026-09-26 10:00:00', '2026-09-26 10:45:00', ''),
  (25, 1, '2026-09-27 09:00:00', '2026-09-27 12:00:00', 'Split PaymentService');
