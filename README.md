# TaskFlow

A team task manager with two clients on one backend:

- **TaskFlow Web**: a React 19 + TypeScript + Redux Toolkit single-page app (projects, assignments, checklists,
  labels, time tracking, live notifications, activity feeds, reports).
- **TaskFlow Admin**: server-rendered JSP pages (Spring MVC + JSTL + Spring form/security tags).
- **Backend**: Spring Boot 3.5 (Spring MVC, Spring Security, Spring Data JPA, Flyway) on Tomcat 10.1 + MySQL 8,
  organised in layers (controller → service → repository → entity) with Lombok. It serves the admin pages and the
  JSON API. The React app also runs INSIDE the backend: as React islands in JSP pages, and as a full SPA under `/taskflow/app/`.

## Layout

```text
frontend/            React app: src/ (feature-first: see frontend/README.md) and tests/
backend/             Spring Boot WAR: layered Java code (see backend/CONCEPTS.md), JSP views, Flyway migrations
  db/                the one-time MySQL set-up (database + least-privilege accounts); the schema is Flyway's
styles/              the shared SCSS design system, compiled for BOTH clients
docker-compose.yml   MySQL 8.4 on :3306 + a standalone Tomcat 10.1 on :8081 running taskflow.war
```

Study maps: `frontend/CONCEPTS.md`, `frontend/STYLING.md`, `backend/CONCEPTS.md`,
`frontend/src/features/reports/legacy/MIGRATION.md`.

## How to run

Install once:

```bash
npm install
```

```bash
cd frontend && npm install
```

### Development: the backend with a MySQL container

Docker Desktop must be running. This starts MySQL in Docker (Testcontainers), runs the Flyway migrations, then the
application on http://localhost:8081/taskflow (8080 belongs to the local Apache httpd):

```bash
cd backend && mvn spring-boot:test-run
```

Then the React dev server (`/api` is proxied to :8081):

```bash
cd frontend && npm run dev
```

Open http://localhost:5173 and log in as `alice` / `alice123`. Other demo accounts: `bob` / `bob123`,
`carol` / `bob123`, `dave` / `bob123` (project viewer), `admin` / `admin123`.

### The admin portal and the full WAR

The JSP pages need the compiled design system, and the React builds that live inside the WAR:

```bash
npm run styles:jsp
```

```bash
cd frontend && npm run build:island && npm run build:war
```

```bash
cd backend && mvn package
```

Either run the WAR on its own (embedded Tomcat; needs MySQL on localhost:3306, e.g. `docker compose up -d mysql`):

```bash
java -jar backend/target/taskflow.war
```

or deploy it to the standalone Tomcat 10.1 in Docker:

```bash
docker compose up -d
```

Then open http://localhost:8081/taskflow/ (admin portal), /taskflow/app/ (the SPA in the WAR),
/taskflow/react-board (a React island) and /taskflow/admin/reports (as admin: server tables + the legacy Redux island).

## Checks (all must pass before a commit)

```bash
cd frontend && npm run build && npm run lint && npx vitest run
```

```bash
cd backend && mvn verify
```
