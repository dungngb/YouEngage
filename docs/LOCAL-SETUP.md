# Local Development Setup Guide

## Prerequisites

- **Node.js 22** (already installed)
- **PostgreSQL** — one of:
  - [Neon](https://neon.tech) free tier (recommended, no install needed)
  - Docker: `docker run --name youengage-pg -e POSTGRES_PASSWORD=youengage_password -e POSTGRES_DB=youengage -e POSTGRES_USER=youengage -p 5432:5432 -d postgres:16`
  - Native PostgreSQL installation

## Step 1 — Clone & Install

```bash
cd C:\Users\dung.bui\AppData\Roaming\YouEngage
npm install
```

## Step 2 — Configure Environment

Edit `.env.local`:

```env
# Database — update with your PostgreSQL connection string
DATABASE_URL="postgresql://youengage:youengage_password@localhost:5432/youengage?schema=public"
# If using Neon: DATABASE_URL="postgresql://user:pass@ep-xxx.region.aws.neon.tech/youengage?sslmode=require"

# NextAuth
AUTH_SECRET="dev-secret-change-in-production-openssl-rand-base64-32"
AUTH_URL="http://localhost:3000"
AUTH_TRUST_HOST=true

# Microsoft Entra ID (placeholder values — SSO won't work but app boots fine)
AUTH_MICROSOFT_ENTRA_ID_ID="your-azure-client-id"
AUTH_MICROSOFT_ENTRA_ID_SECRET="your-azure-client-secret"
AUTH_MICROSOFT_ENTRA_ID_TENANT_ID="your-azure-tenant-id"

# Dev Auth — enables local login with demo users
DEV_AUTH=true
```

## Step 3 — Initialize Database

```bash
npm run db:generate    # Generate Prisma client
npm run db:push        # Create schema in PostgreSQL
npm run db:seed        # Insert demo data (roles, users, engagements, tasks, etc.)
```

## Step 4 — Start Development Server

```bash
npm run dev
```

App will be available at **http://localhost:3000**.

## Step 5 — Login

1. Open http://localhost:3000/login
2. The page shows an amber "DEV LOGIN" section at the bottom
3. Select a demo user from the dropdown:
   - **chief@demo.local** — Chief Auditor (sees all engagements)
   - **manager1@demo.local** — Manager 1 (scoped to assigned engagements)
   - **manager2@demo.local** — Manager 2 (scoped to assigned engagements)
   - **auditor1@demo.local** — Auditor 1
   - **auditor2@demo.local** — Auditor 2
   - **auditor3@demo.local** — Auditor 3
4. Click "Đăng nhập (Dev)"
5. You'll be redirected to the dashboard

## Troubleshooting

| Issue | Solution |
|-------|----------|
| `P1001: Can't reach database server` | Check DATABASE_URL and that PostgreSQL is running |
| Login redirects back to login page | Ensure `AUTH_SECRET` is set and `DEV_AUTH=true` |
| "Configuration" error on Microsoft login | Expected — placeholder SSO credentials. Use Dev Login instead |
| Prisma schema out of sync | Run `npm run db:generate` then `npm run db:push` |
| Seed fails with unique constraint | Database already seeded — run `npx prisma db push --force-reset` then re-seed |

## Running Smoke Tests

```bash
# HTTP smoke test (requires dev server running on port 3000)
node scripts/local-smoke-test.mjs

# Phase 7 action logic test (direct DB validation, server not required)
npx tsx scripts/phase7-action-test.mjs
```

## Resetting Demo Data

```bash
# Option 1: Full reset (drops all data then re-seeds)
npx prisma db push --force-reset && npx tsx prisma/seed.ts

# Option 2: Clear engagement data only (keeps users/roles)
# See scripts in docs/LOCAL-SMOKE-RESULTS.md
```

## Security Note

The `DEV_AUTH=true` flag and CredentialsProvider are **for local development only**. Never enable in production. The provider is completely excluded from the build when `DEV_AUTH` is not set to `"true"`.
