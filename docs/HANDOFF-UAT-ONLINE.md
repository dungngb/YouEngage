# Handoff — UAT Online Deploy (2026-03-12)

## Summary

All code changes for Vercel deployment are complete. File storage migrated from local filesystem to Vercel Blob. Prisma schema updated for Neon pooled/direct connections. Deployment is ready pending infrastructure setup (Neon, Vercel, Azure AD).

## Code Changes Made

| Change | Description |
|--------|-------------|
| `@vercel/blob@2.3.1` installed | Cloud file storage for Vercel serverless |
| `prisma/schema.prisma` | Added `directUrl = env("DIRECT_URL")` for Neon |
| `next.config.mjs` | Removed `output: "standalone"` (Vercel uses default) |
| `src/app/api/upload/route.ts` | `fs.writeFile` → `@vercel/blob` `put()` |
| `src/app/api/files/[id]/route.ts` | `fs.readFile` → `fetch()` from blob URL |
| `src/lib/actions/task.ts` | `fs.unlink` → `@vercel/blob` `del()` |
| `.env.example` | Updated with `DIRECT_URL`, `BLOB_READ_WRITE_TOKEN`, removed `UPLOAD_DIR` |
| `scripts/uat-online-smoke-test.mjs` | Automated smoke test for UAT URL |

## Infrastructure Setup Required

### 1. Neon UAT Database
- Create project **YouEngage-UAT** on [console.neon.tech](https://console.neon.tech)
- Get pooled connection string → `DATABASE_URL`
- Get direct connection string → `DIRECT_URL`
- Run: `npx prisma db push && npx tsx prisma/seed.ts`

### 2. Vercel Project
- Import repo → auto-detect Next.js
- Build command: `npx prisma generate && next build`
- Add Blob store → auto-sets `BLOB_READ_WRITE_TOKEN`
- Set all env vars (see `UAT-ONLINE-SETUP.md` section B.3)

### 3. Azure AD App Registration
- Create **YouEngage UAT** app registration
- Redirect URI: `https://<vercel-url>/api/auth/callback/microsoft-entra-id`
- Copy client ID, secret, tenant ID → set as env vars

### Environment Variables Checklist

| Variable | Source |
|----------|--------|
| `DATABASE_URL` | Neon (pooled) |
| `DIRECT_URL` | Neon (direct) |
| `AUTH_SECRET` | `openssl rand -base64 32` |
| `AUTH_URL` | Vercel deployment URL |
| `AUTH_TRUST_HOST` | `true` |
| `AUTH_MICROSOFT_ENTRA_ID_ID` | Azure Portal |
| `AUTH_MICROSOFT_ENTRA_ID_SECRET` | Azure Portal |
| `AUTH_MICROSOFT_ENTRA_ID_TENANT_ID` | Azure Portal |
| `BLOB_READ_WRITE_TOKEN` | Auto-set by Vercel Blob |
| `MAX_FILE_SIZE_MB` | `50` (optional) |

**DO NOT set**: `DEV_AUTH`, `UPLOAD_DIR`

## Smoke Test

```bash
UAT_URL=https://your-app.vercel.app node scripts/uat-online-smoke-test.mjs
```

- 12 automated tests (health, auth, guard, API security)
- 8 manual browser tests (SSO, scope, signoff, upload, locale)

## Migrations & Seed Status

- **PENDING** — Run after Neon project is created:
  ```bash
  DATABASE_URL="..." DIRECT_URL="..." npx prisma db push
  DATABASE_URL="..." npx tsx prisma/seed.ts
  ```

## Documentation

| Document | Description |
|----------|-------------|
| `docs/UAT-ONLINE-SETUP.md` | Full setup guide (Neon + Vercel + Azure AD) |
| `docs/UAT-ONLINE-SMOKE-RESULTS.md` | Smoke test results template (pending) |
| `docs/UAT-ONLINE-GO-NO-GO.md` | GO/NO-GO checklist (pending deploy) |
| `docs/HANDOFF-UAT-ONLINE.md` | This file |

## Conclusion

Code is deployment-ready. Once infrastructure is provisioned (Neon DB, Vercel project, Azure AD app), run migrations/seed and smoke tests. When all pass: **READY TO INVITE USERS**.
