# Runtime Defects Report

**Dự án**: YouEngage — Internal Audit Workflow Management
**Ngày**: 2026-03-04
**Phương pháp**: Runtime testing (dev server, no DB)

---

## Runtime Defects Found

### RDEF-001: AUTH_URL port mismatch in redirect (LOW — Configuration)

**Severity**: LOW
**Type**: Configuration
**Status**: NOT A DEFECT — Expected behavior

**Description**: Middleware redirects to `http://localhost:3000/login` (AUTH_URL from .env.local) even when dev server runs on port 3099. This causes redirect to fail if port 3000 is not listening.

**Impact**: Development only. In production, AUTH_URL sẽ match deployment URL. Không ảnh hưởng pilot.

**Fix**: Khi deploy production, set `AUTH_URL` đúng URL thật (e.g., `https://youengage.company.com`).

**Verdict**: Not a defect. Expected Next-Auth behavior — AUTH_URL is the canonical URL.

---

### RDEF-002: NextAuth v5 `signin` action warning (LOW — Expected)

**Severity**: LOW
**Type**: Warning
**Status**: NOT A DEFECT — NextAuth internal behavior

**Description**: Khi truy cập `/api/auth/signin/microsoft-entra-id` trực tiếp (không qua form), NextAuth v5 logs `[auth][error] UnknownAction`. Server returns 302 with `error=Configuration`.

**Impact**: Không ảnh hưởng normal user flow. Users sẽ click SSO button trên login page, không navigate trực tiếp.

**Fix**: Không cần fix. Đây là NextAuth v5 beta internal behavior cho unsupported action method.

---

## Runtime Warnings (Not Defects)

| # | Area | Warning | Impact | Action |
|---|------|---------|--------|--------|
| 1 | Dev mode | Cold compilation 1-5s cho first request | None — production build pre-compiles | None |
| 2 | SSO | Placeholder Azure credentials | Cannot test SSO | Replace before pilot |
| 3 | Database | No PostgreSQL available | Cannot test DB operations | Deploy on target server |

---

## Infrastructure Blockers

| # | Blocker | Severity | Required for Pilot |
|---|---------|----------|--------------------|
| 1 | PostgreSQL not installed | BLOCKER | YES — must install or use Docker |
| 2 | Docker not installed | BLOCKER | YES — recommended deployment method |
| 3 | Azure AD credentials placeholder | BLOCKER | YES — must configure real tenant |

---

## Comparison with Phase 6 Defects

| Source | Found | Fixed | Open |
|--------|-------|-------|------|
| Phase 6 code review | 7 | 7 | 0 |
| Runtime rehearsal | 0 real defects | N/A | 0 |
| **Total** | **7** | **7** | **0** |

**Kết luận**: Runtime rehearsal không phát hiện defect mới. 2 items reported (RDEF-001, RDEF-002) là expected behavior, không phải defect. Infrastructure blockers cần giải quyết trước pilot.
