# Time Tracker — Freelance billing app

A time-tracking app for freelance work. Logs billable and non-billable
time against clients/projects and shows a reporting dashboard.

## Stack
- Frontend: React + Vite (JavaScript, JSX) (in /client)
- Styling: Tailwind CSS v4 (via @tailwindcss/vite plugin)
- Backend: Node.js 22 + Express + TypeScript (in /server)
- ORM: Prisma
- Database: PostgreSQL 18
- Validation: Zod (shared between client and server; runtime validation,
  works in the JS frontend)
- Server state (frontend): TanStack Query
- Charts: Recharts
- Containerization: Docker + Docker Compose

## Repo layout
Monorepo, single git repo. Each package has its own package.json.
- /client            React + Vite frontend (+ Dockerfile, Dockerfile.dev)
- /server            Express + Prisma backend (+ Dockerfile, Dockerfile.dev)
- /shared            (optional) shared Zod schemas imported by both sides
- docker-compose.yml          dev orchestration
- docker-compose.prod.yml     (optional) production overrides
- .dockerignore      per package

## Containerization — Docker
Three services orchestrated by Docker Compose: db (Postgres), server, client.
- Base images: node:22-alpine (matches host Node 22.17.1), postgres:18-alpine.
- POSTGRES 18 VOLUME CHANGE — IMPORTANT: the official postgres image moved
  PGDATA to a version-specific path (/var/lib/postgresql/18/docker) and the
  declared VOLUME to /var/lib/postgresql. Mount the named volume at
  /var/lib/postgresql, NOT /var/lib/postgresql/data. If you mount at /data
  without also setting PGDATA, Postgres writes to an anonymous volume and
  your data is silently lost on `docker compose down`.
- DB credentials and DATABASE_URL come from env vars, never hardcoded.
  Compose reads them from a root .env (gitignored).
- The server's DATABASE_URL host is the compose service name `db`
  (postgresql://user:pass@db:5432/timetracker), NOT localhost.

Development (docker-compose.yml):
- Mount source as volumes for hot reload (Vite HMR for client, tsx/nodemon
  watch for server). Add an anonymous /app/node_modules volume so host
  modules don't clobber container modules.
- Vite must listen on 0.0.0.0 inside the container (pass --host 0.0.0.0 or
  set server.host in vite.config.js) or HMR won't reach the browser.
- Run migrations via `docker compose exec server npx prisma migrate dev`.

Production (multi-stage Dockerfiles):
- server: build stage compiles TS -> dist and runs `prisma generate`;
  runtime stage runs `node dist` and `prisma migrate deploy` on release.
- client: build stage runs `npm run build` -> static assets; serve with
  nginx. Never ship the Vite dev server to production.
- .dockerignore keeps node_modules, .env, .git, dist out of build context.

Note (Windows/WSL2): if developing on Windows, run Docker via the WSL2
backend and keep the repo inside the Linux filesystem — bind-mount file
watching across the Windows/WSL boundary is slow and breaks HMR.

## Architecture
- Backend is layered, keep these separate:
  - routes/controllers — HTTP handling + Zod validation
  - services — business logic (rate resolution, billable rollups,
    dashboard aggregation)
  - data access — Prisma queries and transactions
- Frontend uses TanStack Query for fetching/caching server state.
- REST API, JSON over HTTPS.

## Data model (core rules — do not deviate)
- Entities: users, clients, projects, time_entries.
- time_entries.hourly_rate is SNAPSHOTTED at entry creation. Resolve the
  rate once from the project (project.hourly_rate) and store it on the entry.
  Clients and users do NOT carry a rate. Never re-derive an existing entry's
  value from the project's current rate — past entries must not re-price when
  a rate changes.
- is_billable lives on time_entry. projects.is_billable_default is only
  the prefill value when creating an entry.
- A running timer is a time_entry with end_time = null. duration is
  computed when the timer stops.
- Dashboard aggregations (totals, revenue per client/project, billable
  vs non-billable) run in Postgres via Prisma groupBy / SQL — never by
  fetching all rows and summing in JavaScript.

## Commands
- `docker compose up --build`                start all services
- `docker compose up db`                      start only Postgres
- `docker compose exec server npx prisma migrate dev`   run a migration
- `docker compose exec server npx prisma studio`        inspect the DB
- `docker compose down`                       stop services (keeps data)
- `docker compose down -v`                    stop and WIPE the DB volume

## Conventions
- Backend: TypeScript strict, no `any`. Type rates/durations explicitly;
  handle the null-rate case (never let an unset rate become NaN).
- Frontend: plain JavaScript (JSX), no TypeScript.
- Styling: Tailwind utility classes in JSX; no separate CSS files.
- Commits in imperative mood.
- Secrets in .env (gitignored); keep a .env.example up to date.