-- PROVIDED. Run as an ADMIN account (root) ONCE. Docker runs it automatically on first start.
-- Creates the database and TWO accounts. The schema itself is NOT here any more: Flyway creates and evolves it
-- (src/main/resources/db/migration/V*.sql) when the application starts.
--
--   taskflow_migrator  owns the schema: CREATE/ALTER/DROP/INDEX/REFERENCES. Used ONLY by Flyway at startup.
--   taskflow_app       the account every request runs as: data rights only (SELECT/INSERT/UPDATE/DELETE).
--                      A SQL injection through it can't drop a table, read another database or grant itself more.

CREATE DATABASE IF NOT EXISTS taskflow
  CHARACTER SET utf8mb4            -- real UTF-8: Vietnamese, emoji (MySQL's old 'utf8' is 3-byte, no emoji)
  COLLATE utf8mb4_0900_ai_ci;      -- accent- and case-INsensitive comparisons (see the unique title rule, V1)

-- ⚠️ Development passwords. Production: generated secrets, passed by the environment, never committed.
CREATE USER IF NOT EXISTS 'taskflow_migrator'@'%' IDENTIFIED BY 'taskflow_migrator_dev_pw';
CREATE USER IF NOT EXISTS 'taskflow_app'@'%'      IDENTIFIED BY 'taskflow_dev_pw';

GRANT ALL PRIVILEGES ON taskflow.* TO 'taskflow_migrator'@'%';
-- Database-level, so it also covers tables Flyway creates later. The audit log is append-only by DESIGN in the
-- application (AuditRepository has no update or delete method); a table-level grant would need the table to exist first.
GRANT SELECT, INSERT, UPDATE, DELETE ON taskflow.* TO 'taskflow_app'@'%';
