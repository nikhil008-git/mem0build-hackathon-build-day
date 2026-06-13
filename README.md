# Riftnew

Turborepo monorepo with a Next.js frontend, Express API, and PostgreSQL via Prisma.

## Prerequisites

- Node.js 18+
- PostgreSQL

## Setup

1. Install dependencies from the repo root:

```sh
npm install
```

2. Create `.env` files (see `.env.example` at the root):

- `packages/database/.env`
- `apps/frontend/.env`

Both need:

```env
DATABASE_URL=postgresql://user:password@localhost:5432/riftnew
BETTER_AUTH_SECRET=your-secret-here
BETTER_AUTH_URL=http://localhost:3000
```

3. Generate the Prisma client and run migrations:

```sh
npm run db:generate
npm run db:migrate
```

4. Start development:

```sh
npm run dev
```

- Frontend: http://localhost:3000
- API: http://localhost:8080

## Project layout

```
apps/
  frontend/     Next.js app
  api/          Express API
packages/
  database/     Prisma schema and client (@repo/db)
  ui/           Shared React components
  eslint-config/
  typescript-config/
```

## Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start all apps in dev mode |
| `npm run build` | Build all apps and packages |
| `npm run lint` | Lint the monorepo |
| `npm run db:generate` | Generate Prisma client |
| `npm run db:migrate` | Run database migrations |
| `npm run db:deploy` | Deploy migrations (production) |

Run a single app:

```sh
npx turbo dev --filter=frontend
npx turbo dev --filter=api
```
