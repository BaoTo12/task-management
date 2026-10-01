-- V3 · PROVIDED. Team work: projects, their members (with a role), and tasks that belong to a project and are
-- ASSIGNED to someone. Who may see a task becomes: its owner, its assignee, a member of its project, or an admin.

CREATE TABLE projects (
  id          BIGINT        NOT NULL AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(80)   NOT NULL,
  description VARCHAR(1000) NOT NULL DEFAULT '',
  color       CHAR(7)       NOT NULL DEFAULT '#2563eb',
  owner_id    BIGINT        NOT NULL,             -- who created it (also an OWNER member)
  archived    BOOLEAN       NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_projects_owner FOREIGN KEY (owner_id) REFERENCES users (id) ON DELETE CASCADE,
  CONSTRAINT uq_projects_owner_name UNIQUE (owner_id, name)
);

-- The role decides what a member may do (ProjectRole): OWNER > MAINTAINER > MEMBER > VIEWER.
CREATE TABLE project_members (
  project_id BIGINT    NOT NULL,
  user_id    BIGINT    NOT NULL,
  role       ENUM('OWNER', 'MAINTAINER', 'MEMBER', 'VIEWER') NOT NULL DEFAULT 'MEMBER',
  joined_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (project_id, user_id),               -- a composite key: one membership per user and project
  CONSTRAINT fk_members_project FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE CASCADE,
  CONSTRAINT fk_members_user    FOREIGN KEY (user_id)    REFERENCES users (id)    ON DELETE CASCADE,
  INDEX ix_members_user (user_id)                  -- "which projects am I in?" on every task list
);

ALTER TABLE tasks
  ADD COLUMN project_id   BIGINT    NULL AFTER category_id,
  ADD COLUMN assignee_id  BIGINT    NULL AFTER owner_id,
  ADD COLUMN completed_at TIMESTAMP NULL AFTER updated_at,   -- set when the status becomes DONE (the reports need it)
  ADD CONSTRAINT fk_tasks_project  FOREIGN KEY (project_id)  REFERENCES projects (id) ON DELETE SET NULL,
  ADD CONSTRAINT fk_tasks_assignee FOREIGN KEY (assignee_id) REFERENCES users (id)    ON DELETE SET NULL,
  ADD INDEX ix_tasks_project (project_id, status),
  ADD INDEX ix_tasks_assignee (assignee_id, status),
  ADD INDEX ix_tasks_completed (completed_at);

-- ── Demo data ──────────────────────────────────────────────────────────────────────────────────────────────
INSERT INTO projects (id, name, description, color, owner_id, archived, created_at) VALUES
  (1, 'Website relaunch', 'New marketing site and docs portal, live before the October conference.', '#7c3aed', 1, FALSE, '2026-08-20 09:00:00'),
  (2, 'Mobile app', 'The payments rewrite and the 2.0 release.', '#059669', 2, FALSE, '2026-08-25 09:00:00');

INSERT INTO project_members (project_id, user_id, role, joined_at) VALUES
  (1, 1, 'OWNER',      '2026-08-20 09:00:00'),
  (1, 4, 'MAINTAINER', '2026-08-20 10:00:00'),
  (1, 2, 'MEMBER',     '2026-08-21 09:00:00'),
  (1, 5, 'VIEWER',     '2026-08-22 09:00:00'),
  (2, 2, 'OWNER',      '2026-08-25 09:00:00'),
  (2, 1, 'MEMBER',     '2026-08-25 10:00:00'),
  (2, 4, 'MEMBER',     '2026-08-26 09:00:00');

UPDATE tasks SET project_id = 1, assignee_id = 1 WHERE id IN (2, 13);
UPDATE tasks SET project_id = 1, assignee_id = 4 WHERE id IN (5, 9);
UPDATE tasks SET project_id = 1, assignee_id = 2 WHERE id IN (6, 18);
UPDATE tasks SET project_id = 1                  WHERE id IN (14, 20);
UPDATE tasks SET project_id = 2, assignee_id = 1 WHERE id = 25;
UPDATE tasks SET project_id = 2, assignee_id = 4 WHERE id = 24;
-- The DONE tasks were completed on different days of September, so the reports have a curve to draw.
UPDATE tasks SET completed_at = '2026-09-12 16:00:00' WHERE id = 3;
UPDATE tasks SET completed_at = '2026-09-15 11:30:00' WHERE id = 8;
UPDATE tasks SET completed_at = '2026-09-15 17:45:00' WHERE id = 12;
UPDATE tasks SET completed_at = '2026-09-18 10:00:00' WHERE id = 17;
UPDATE tasks SET completed_at = '2026-09-19 14:20:00' WHERE id = 21;
