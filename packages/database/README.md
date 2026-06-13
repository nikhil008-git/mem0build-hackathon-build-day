# @repo/db

Prisma ORM client and PostgreSQL schema.

## Setup

Create `packages/database/.env`:

```env
DATABASE_URL=postgresql://user:password@localhost:5432/riftnew
```

## Commands

From the repo root:

```sh
npm run db:generate
npm run db:migrate
npm run db:deploy
```
