# Time Tracker

Freelance time-tracking & billing app. Logs billable / non-billable time
against clients and projects, with a reporting dashboard.

See [CLAUDE.md](./CLAUDE.md) for the authoritative architecture and data-model rules.

## Stack
- **Client** (`/client`): React 19 + Vite, plain JS/JSX, Tailwind CSS v4, TanStack Query, Recharts.
- **Server** (`/server`): Node 22 + Express + TypeScript (strict), Prisma, Zod.
- **Database**: PostgreSQL 18.
- **Orchestration**: Docker Compose.

## Quick start (Docker)
```bash
cp .env.example .env          # then edit secrets
docker compose up --build     # db + server + client

# In another shell, create the schema:
docker compose exec server npx prisma migrate dev --name init
```
- Client: http://localhost:5173
- API: http://localhost:4000 (health: `/health`)

## Commands
| Command | What it does |
| --- | --- |
| `docker compose up --build` | Start all services (dev, hot reload) |
| `docker compose up db` | Start only Postgres |
| `docker compose exec server npx prisma migrate dev` | Run a migration |
| `docker compose exec server npx prisma studio` | Inspect the DB |
| `docker compose down` | Stop services (keeps data) |
| `docker compose down -v` | Stop and **wipe** the DB volume |

Production build:
```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml up --build -d
```

## Layout
```
client/   React + Vite frontend (Dockerfile, Dockerfile.dev, nginx.conf)
server/   Express + Prisma backend (layered: controllers → services → data)
            prisma/schema.prisma — data model
docker-compose.yml        dev orchestration
docker-compose.prod.yml   production overrides
```

## Scaffold notes / TODO
- **No `/shared` package yet.** CLAUDE.md marks it optional, and its detailed
  per-package Docker setup (independent build contexts, per-package
  `.dockerignore`) conflicts with the simplest cross-package sharing approach
  (npm workspaces + a single root build context). Zod schemas are therefore
  duplicated: canonical typed copy in `server/src/schemas`, JS mirror in
  `client/src/schemas.js`. Promote to a shared workspace later if desired.
- **No real auth.** `server/src/middleware/currentUser.ts` is a scaffold shim
  that resolves a single auto-created demo user. Replace before shipping.
- Windows/WSL2: run Docker via the WSL2 backend and keep the repo inside the
  Linux filesystem, or Vite HMR over the bind mount will be slow/broken.
