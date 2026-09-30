# TaskFlow

A task manager with two clients on one backend:

- **TaskFlow Web**: a React + TypeScript + Redux Toolkit single-page app.
- **TaskFlow Admin**: server-rendered JSP pages (the admin portal).
- **Backend**: Java Servlets on Tomcat 9 + MySQL 8, serving the admin pages and a JSON API for the React app.
  The React app also runs INSIDE the backend: as React islands in JSP pages, and as a full SPA under `/taskflow/app/`.

## Layout

```text
frontend/            React app: src/ (the app, feature-first: see frontend/README.md) and tests/
backend/             Maven WAR: servlets, filters, JSP views, JSON API; db/ = MySQL scripts, tomcat/ = server.xml
styles/              the shared SCSS design system, compiled for BOTH clients
docker-compose.yml   MySQL 8 on :3306 + Tomcat 9 on :8081
```

Study maps: `frontend/CONCEPTS.md`, `frontend/STYLING.md`, `backend/CONCEPTS.md`.

## How to run

Install once:

```bash
npm install
```

```bash
cd frontend && npm install
```

### Development: the React app on the backend

Docker Desktop must be running (the dev server starts MySQL with Testcontainers). Start Tomcat + MySQL on port 8081
(8080 belongs to the local Apache httpd):

```bash
cd backend && mvn -q test-compile dependency:build-classpath -Dmdep.outputFile=target/cp.txt
```

Then, in `backend/` (PowerShell shown; use `:` instead of `;` on macOS/Linux):

```powershell
java -cp "target/classes;target/test-classes;$(Get-Content target/cp.txt)" com.taskflow.DevServer
```

And the frontend (`/api` is proxied to Tomcat on :8081):

```bash
cd frontend && npm run dev
```

Open http://localhost:5173 and log in as `alice` / `alice123` (admin: `admin` / `admin123`).

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

```bash
docker compose up -d
```

Then open http://localhost:8081/taskflow/ (admin portal), /taskflow/app/ (the SPA in the WAR) and
/taskflow/react-board (a React island in a JSP page).

## Checks (all must pass before a commit)

```bash
cd frontend && npm run build && npm run lint && npx vitest run
```

```bash
cd backend && mvn package
```
