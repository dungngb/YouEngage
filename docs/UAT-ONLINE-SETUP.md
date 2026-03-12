# UAT Online — Setup Guide

## Architecture

```
Browser → Vercel (Next.js) → Neon PostgreSQL (UAT)
                ↓
         Vercel Blob (file storage)
                ↓
         Microsoft Entra ID (SSO)
```

---

## A. Neon UAT Database

### 1. Create Neon Project

1. Go to [console.neon.tech](https://console.neon.tech)
2. Create new project: **YouEngage-UAT**
3. Region: choose closest to Vercel deployment region
4. Database name: `youengage`

### 2. Get Connection Strings

From Neon dashboard → Connection Details:

- **Pooled** (for runtime — set as `DATABASE_URL`):
  ```
  postgresql://user:pass@ep-xxx-pooler.region.neon.tech/youengage?sslmode=require
  ```
  Note: URL contains `-pooler` in hostname.

- **Direct** (for migrations — set as `DIRECT_URL`):
  ```
  postgresql://user:pass@ep-xxx.region.neon.tech/youengage?sslmode=require
  ```
  Note: URL does NOT contain `-pooler`.

### 3. Run Migrations & Seed

```bash
# Set env vars pointing to UAT Neon
export DATABASE_URL="postgresql://...pooler..."
export DIRECT_URL="postgresql://...direct..."

# Push schema (or migrate deploy if migrations exist)
npx prisma db push

# Seed demo data
npx tsx prisma/seed.ts

# Verify
npx prisma studio
```

---

## B. Vercel Deployment

### 1. Connect Repository

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import the YouEngage Git repository
3. Framework Preset: **Next.js** (auto-detected)
4. Build Command: `npx prisma generate && next build`
5. Output Directory: (leave default)

### 2. Add Blob Store

1. In Vercel project → Storage → Create → Blob
2. Name: `youengage-uat-files`
3. This auto-sets `BLOB_READ_WRITE_TOKEN` env var

### 3. Environment Variables

Set the following in Vercel → Settings → Environment Variables:

| Variable | Value | Notes |
|----------|-------|-------|
| `DATABASE_URL` | Neon pooled connection string | With `-pooler` in host |
| `DIRECT_URL` | Neon direct connection string | Without `-pooler` |
| `AUTH_SECRET` | `openssl rand -base64 32` | Generate new secret |
| `AUTH_URL` | `https://your-app.vercel.app` | Your Vercel URL |
| `AUTH_TRUST_HOST` | `true` | Required for Vercel |
| `AUTH_MICROSOFT_ENTRA_ID_ID` | Azure client ID | From App Registration |
| `AUTH_MICROSOFT_ENTRA_ID_SECRET` | Azure client secret | From App Registration |
| `AUTH_MICROSOFT_ENTRA_ID_TENANT_ID` | Azure tenant ID | From Entra ID |
| `BLOB_READ_WRITE_TOKEN` | Auto-set by Vercel Blob | Don't set manually |
| `MAX_FILE_SIZE_MB` | `50` | Optional (default: 50) |

**DO NOT set:**
- `DEV_AUTH` — must not be set in UAT (disables dev-credentials provider)
- `UPLOAD_DIR` — not used (Vercel Blob replaces local filesystem)

### 4. Deploy

```bash
# Vercel auto-deploys on push, or manually:
vercel --prod
```

### 5. Post-Deploy Verification

```bash
# Run smoke test against UAT URL
UAT_URL=https://your-app.vercel.app node scripts/uat-online-smoke-test.mjs
```

---

## C. Azure AD / Entra ID SSO

### 1. Create App Registration

1. Azure Portal → Microsoft Entra ID → App registrations → New registration
2. **Name**: YouEngage UAT
3. **Supported account types**: Single tenant (or multi-tenant per org policy)
4. **Redirect URI**: Web → `https://your-app.vercel.app/api/auth/callback/microsoft-entra-id`

### 2. Configure App

1. **Certificates & secrets** → New client secret → Copy value → set as `AUTH_MICROSOFT_ENTRA_ID_SECRET`
2. **Overview** → Copy Application (client) ID → set as `AUTH_MICROSOFT_ENTRA_ID_ID`
3. **Overview** → Copy Directory (tenant) ID → set as `AUTH_MICROSOFT_ENTRA_ID_TENANT_ID`

### 3. Token Configuration (optional)

- Add optional claim: `email` (if not already present)
- API permissions: `User.Read` (default — sufficient for login)

### 4. Test SSO Flow

1. Open `https://your-app.vercel.app/login`
2. Click "Sign in with Microsoft"
3. Authenticate with Azure AD credentials
4. Should redirect to `/dashboard`
5. New user gets `auditor` role by default (via `createUser` event)

---

## D. Prisma Schema Changes for Vercel

The following changes were made to support Vercel + Neon:

### `prisma/schema.prisma`
```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}
```

`directUrl` tells Prisma to use the direct connection for migrations (bypassing connection pooler, which doesn't support DDL).

### `next.config.mjs`
```js
const nextConfig = {
  // output: "standalone" removed — Vercel uses default
};
```

### File Storage
- Upload route: `@vercel/blob` `put()` replaces `fs.writeFile`
- Download route: `fetch()` from blob URL replaces `fs.readFile`
- Delete: `@vercel/blob` `del()` replaces `fs.unlink`
- `storagePath` in Attachment model now stores blob URL instead of relative path

---

## E. Rollback to Docker

If reverting to Docker deployment:

1. Restore `output: "standalone"` in `next.config.mjs`
2. Restore `UPLOAD_DIR`-based file handling in upload/download/delete routes
3. Remove `directUrl` from Prisma schema (or keep — harmless if `DIRECT_URL` not set)
4. Use `docker-compose.yml` as before
