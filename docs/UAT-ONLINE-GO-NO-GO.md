# UAT Online — GO / NO-GO Decision

**Date**: 2026-03-12
**Status**: PENDING DEPLOYMENT

---

## Pre-Deployment Checklist

| Item | Status |
|------|--------|
| Neon UAT database created | PENDING |
| Prisma schema updated (directUrl) | DONE |
| Migrations pushed to UAT DB | PENDING |
| Seed data loaded | PENDING |
| Vercel project connected | PENDING |
| Vercel Blob store linked | PENDING |
| Environment variables set | PENDING |
| Azure AD App Registration created | PENDING |
| Redirect URI configured | PENDING |
| `output: "standalone"` removed | DONE |
| File storage migrated to Vercel Blob | DONE |
| TypeScript compiles (0 errors) | DONE |
| Build succeeds on Vercel | PENDING |

## Code Changes (for Vercel compatibility)

| File | Change | Status |
|------|--------|--------|
| `prisma/schema.prisma` | Added `directUrl = env("DIRECT_URL")` | DONE |
| `next.config.mjs` | Removed `output: "standalone"` | DONE |
| `src/app/api/upload/route.ts` | `fs.writeFile` → `@vercel/blob` `put()` | DONE |
| `src/app/api/files/[id]/route.ts` | `fs.readFile` → `fetch()` from blob URL | DONE |
| `src/lib/actions/task.ts` | `fs.unlink` → `@vercel/blob` `del()` | DONE |
| `.env.example` | Updated with `DIRECT_URL`, `BLOB_READ_WRITE_TOKEN` | DONE |
| `package.json` | Added `@vercel/blob@2.3.1` | DONE |

## Smoke Test Results

| Category | Tests | Pass | Fail |
|----------|-------|------|------|
| Automated (S1-S6) | 12 | PENDING | PENDING |
| Manual Browser (M1-M8) | 8 | PENDING | PENDING |
| **Total** | **20** | **PENDING** | **PENDING** |

## Decision

**PENDING** — Complete deployment and smoke tests, then update:

- [ ] All automated smoke tests pass
- [ ] SSO login works end-to-end
- [ ] File upload/download works via browser
- [ ] Scope isolation verified (multi-role)
- [ ] Locale toggle works
- [ ] No blocker defects

When all checks pass: **READY TO INVITE USERS**
