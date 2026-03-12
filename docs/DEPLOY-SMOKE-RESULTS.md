# Phase 6 — Deployment Smoke Test Results

**Dự án**: YouEngage
**Phương pháp**: Build verification + configuration review (không có live environment)
**Ngày**: 2026-03-04

---

## 1. Giới hạn

Không có production/staging environment để test thực tế. Smoke test dựa trên:
- `npx next build` verification
- Dockerfile review
- docker-compose.yml review
- Environment config review
- Storage config review

---

## 2. Build Verification

| # | Check | Result | Details |
|---|-------|--------|---------|
| 1 | `npx next build` passes | PASS | 0 errors, 0 warnings, 23 routes compiled |
| 2 | TypeScript compilation | PASS | "Compiled successfully" |
| 3 | Linting | PASS | "Linting and checking validity of types" passed |
| 4 | Static page generation | PASS | 12/12 static pages generated |
| 5 | Middleware compilation | PASS | 78.8 kB middleware |

---

## 3. Docker Configuration Review

### Dockerfile

| # | Check | Result | Details |
|---|-------|--------|---------|
| 1 | Multi-stage build | PASS | builder stage + production stage |
| 2 | Node.js 20 base image | PASS | `node:20-alpine` |
| 3 | Production dependencies only | PASS | `npm ci --only=production` in final stage |
| 4 | Prisma generate | PASS | `npx prisma generate` in build |
| 5 | Next.js standalone output | PASS | `output: "standalone"` in next.config |
| 6 | Non-root user | REVIEW | Runs as root by default — consider adding `USER node` |

### docker-compose.yml

| # | Check | Result | Details |
|---|-------|--------|---------|
| 1 | PostgreSQL service | PASS | postgres:16-alpine |
| 2 | App service | PASS | Builds from Dockerfile |
| 3 | Named volumes | PASS | `db_data`, `uploads` volumes |
| 4 | DB_PASSWORD configurable | PASS | `${DB_PASSWORD}` env var |
| 5 | APP_PORT configurable | PASS | `${APP_PORT:-3000}` |
| 6 | Log rotation | PASS | `max-size: "10m"`, `max-file: "3"` |
| 7 | Database healthcheck | PASS | `pg_isready` check |
| 8 | App depends_on db | PASS | `depends_on: db` with health condition |
| 9 | Restart policy | PASS | `restart: unless-stopped` |

---

## 4. Environment Configuration Review

### .env.example Completeness

| Variable | Present | Required | Notes |
|----------|---------|----------|-------|
| DATABASE_URL | YES | YES | PostgreSQL connection string |
| DB_PASSWORD | YES | YES | For docker-compose |
| AUTH_SECRET | YES | YES | NextAuth secret |
| AUTH_URL | YES | YES | Public app URL |
| AUTH_MICROSOFT_ENTRA_ID_ID | YES | YES | Azure Client ID |
| AUTH_MICROSOFT_ENTRA_ID_SECRET | YES | YES | Azure Client Secret |
| AUTH_MICROSOFT_ENTRA_ID_TENANT_ID | YES | YES | Azure Tenant ID |
| UPLOAD_DIR | YES | NO | Default: ./uploads |
| MAX_FILE_SIZE_MB | YES | NO | Default: 50 |

**Result**: PASS — all required variables documented.

---

## 5. Storage Configuration Review

| # | Check | Result | Details |
|---|-------|--------|---------|
| 1 | UPLOAD_DIR configurable | PASS | env var with `./uploads` default |
| 2 | Directory auto-creation | PASS | `mkdir(dirPath, { recursive: true })` in upload route |
| 3 | Docker volume mount | PASS | `uploads` named volume in docker-compose |
| 4 | File naming convention | PASS | UUID v4 + extension |
| 5 | Subdirectory per engagement | PASS | `uploads/{engagementId}/` |

---

## 6. Database Migration Review

| # | Check | Result | Details |
|---|-------|--------|---------|
| 1 | Migration files exist | PASS | `prisma/migrations/` directory |
| 2 | `prisma migrate deploy` documented | PASS | In README + DEPLOYMENT-CHECKLIST |
| 3 | Seed script | PASS | `npm run db:seed` / `tsx prisma/seed.ts` |

---

## 7. SSO Configuration Review

| # | Check | Result | Details |
|---|-------|--------|---------|
| 1 | Microsoft Entra ID provider | PASS | auth.config.ts |
| 2 | Issuer URL format | PASS | `https://login.microsoftonline.com/{tenant}/v2.0` |
| 3 | Redirect URI documented | PASS | In README + DEPLOYMENT-CHECKLIST |
| 4 | Custom login page | PASS | `pages: { signIn: "/login" }` |

---

## 8. Logging Review

| # | Check | Result | Details |
|---|-------|--------|---------|
| 1 | Application logs | PASS | Next.js default stdout/stderr |
| 2 | Docker log rotation | PASS | max-size: 10m, max-file: 3 |
| 3 | Audit trail in DB | PASS | AuditLog model — immutable |
| 4 | `docker compose logs` accessible | PASS | Standard Docker command |

---

## 9. Summary

| Area | Status | Notes |
|------|--------|-------|
| Build | PASS | Clean build, 0 errors |
| Docker config | PASS | Complete, with healthchecks and log rotation |
| Env config | PASS | All required vars documented |
| Storage | PASS | Configurable, auto-creates dirs |
| DB migration | PASS | Migration + seed scripts available |
| SSO config | PASS | Fully documented |
| Logging | PASS | Docker + audit trail |

**Recommendations**:
- Consider adding `USER node` to Dockerfile for non-root execution
- Test actual deployment on target server before pilot go-live
- Verify SSO redirect URI matches actual deployment URL

**Kết luận**: Deployment configuration review passes. Tất cả components đã được cấu hình đúng cho on-premises Docker Compose deployment. Live smoke test trên target server nên được thực hiện trước pilot go-live.
