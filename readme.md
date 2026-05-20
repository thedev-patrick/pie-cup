# PIE CUP Dashboard

A fullstack Next.js application for managing PIE CUP fixtures, match reports, and tournament statistics backed by PostgreSQL.

## Setup

1. Install dependencies

```bash
cd /Users/patrick/Desktop/pie-cup
npm install
```

2. Create a local PostgreSQL database and copy `.env.example` to `.env`

```bash
cp .env.example .env
```

3. Update `.env` with your PostgreSQL connection string:

```env
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/piecup?schema=public"
```

4. Run Prisma migrations to create the database schema

```bash
npx prisma migrate dev --name init
```

5. Start the app

```bash
npm run dev
```

6. Open the application

- Public site: http://localhost:3000
- Admin dashboard: http://localhost:3000/admin

## Features

- Full Next.js app with public and admin pages
- PostgreSQL persistence via Prisma
- Fixture creation, editing, and match report updates
- Player stats tracking for goals, assists, yellow/red cards
- Tournament progression notes, technical committee, substitutes, discipline logs
- Public view of upcoming fixtures, recent results, ongoing match details, and top stats

## Files of interest

- `app/page.tsx` — public tournament overview
- `app/admin/page.tsx` — administration interface
- `app/api/fixtures` — REST API endpoints for fixtures
- `app/api/summary/route.ts` — aggregated stat summary endpoint
- `prisma/schema.prisma` — PostgreSQL data model
- `lib/prisma.ts` — Prisma client setup

## Next steps

- Add authentication for the admin dashboard
- Add a dedicated player stats editor UI
- Add tournament grouping / bracket visualization
- Add pagination / filter support for fixtures
