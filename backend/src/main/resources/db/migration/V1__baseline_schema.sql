-- V1 · PROVIDED. The schema of the servlet era (S28–S50), now owned by Flyway.
-- Flyway runs every V<n>__*.sql once, in version order, and records it in flyway_schema_history: a migration that
-- already ran is NEVER edited; a change to the schema is a NEW file (V6__…). Runs as taskflow_migrator.

CREATE TABLE users (
  id            BIGINT       NOT NULL AUTO_INCREMENT PRIMARY KEY,
  username      VARCHAR(50)  NOT NULL,
  email         VARCHAR(255) NOT NULL,
  password_hash CHAR(60)     NOT NULL,              -- bcrypt: "$2a$12$" + 53 chars; NEVER leaves the server
  display_name  VARCHAR(100) NOT NULL,
  role          ENUM('USER', 'ADMIN') NOT NULL DEFAULT 'USER',
  locale        CHAR(2)      NOT NULL DEFAULT 'en', -- 'en' | 'vi'
  enabled       BOOLEAN      NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uq_users_username UNIQUE (username),
  CONSTRAINT uq_users_email    UNIQUE (email)
);

CREATE TABLE categories (
  id    BIGINT      NOT NULL AUTO_INCREMENT PRIMARY KEY,
  name  VARCHAR(50) NOT NULL,
  color CHAR(7)     NOT NULL,                       -- '#2563eb'
  CONSTRAINT uq_categories_name UNIQUE (name)
);

CREATE TABLE tasks (
  id          BIGINT        NOT NULL AUTO_INCREMENT PRIMARY KEY,
  title       VARCHAR(120)  NOT NULL,
  description VARCHAR(2000) NOT NULL DEFAULT '',
  status      ENUM('TODO', 'IN_PROGRESS', 'DONE') NOT NULL DEFAULT 'TODO',
  priority    ENUM('LOW', 'MEDIUM', 'HIGH')       NOT NULL DEFAULT 'MEDIUM',  -- ORDER BY priority = LOW, MEDIUM, HIGH
  due_date    DATE          NULL,
  category_id BIGINT        NULL,
  owner_id    BIGINT        NOT NULL,
  created_at  TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_tasks_category FOREIGN KEY (category_id) REFERENCES categories (id) ON DELETE SET NULL,
  CONSTRAINT fk_tasks_owner    FOREIGN KEY (owner_id)    REFERENCES users (id)      ON DELETE CASCADE,
  -- "A title is unique per owner, case-insensitively": the _ci collation makes 'Report' and 'report' EQUAL here.
  CONSTRAINT uq_tasks_owner_title UNIQUE (owner_id, title),
  INDEX ix_tasks_owner_status (owner_id, status),
  INDEX ix_tasks_due_date (due_date)
);

CREATE TABLE comments (
  id         BIGINT        NOT NULL AUTO_INCREMENT PRIMARY KEY,
  task_id    BIGINT        NOT NULL,
  author_id  BIGINT        NOT NULL,
  body       VARCHAR(1000) NOT NULL,                -- stored AS TYPED: escaping is the renderer's job
  created_at TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_comments_task   FOREIGN KEY (task_id)   REFERENCES tasks (id) ON DELETE CASCADE,
  CONSTRAINT fk_comments_author FOREIGN KEY (author_id) REFERENCES users (id) ON DELETE CASCADE,
  INDEX ix_comments_task (task_id, created_at)
);

CREATE TABLE audit_events (
  id       BIGINT       NOT NULL AUTO_INCREMENT PRIMARY KEY,
  type     VARCHAR(40)  NOT NULL,                   -- LOGIN_OK | LOGIN_FAIL | ACCESS_DENIED | …
  username VARCHAR(50)  NULL,                       -- NOT a foreign key: failed logins name unknown users
  ip       VARCHAR(45)  NOT NULL,                   -- fits IPv6
  at       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  details  VARCHAR(500) NULL,
  INDEX ix_audit_at (at),
  INDEX ix_audit_type_at (type, at)
);
