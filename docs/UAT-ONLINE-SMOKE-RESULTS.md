# UAT Online — Smoke Test Results

**Date**: 2026-03-12
**Status**: PENDING DEPLOYMENT

---

## Automated Smoke Tests

**Script**: `scripts/uat-online-smoke-test.mjs`
**Usage**: `UAT_URL=https://your-app.vercel.app node scripts/uat-online-smoke-test.mjs`

| ID | Test | Expected | Result |
|----|------|----------|--------|
| S1-01 | Login page accessible | 200 | PENDING |
| S1-02 | Login page contains SSO button | Microsoft text | PENDING |
| S2-01 | CSRF endpoint accessible | 200 | PENDING |
| S2-02 | Microsoft Entra ID provider listed | Present | PENDING |
| S2-03 | Dev credentials disabled | Not present | PENDING |
| S3-01 | Dashboard redirects to login | 302/307 | PENDING |
| S3-02 | Engagements redirects to login | 302/307 | PENDING |
| S3-03 | Documents redirects to login | 302/307 | PENDING |
| S4-01 | Upload API rejects unauthenticated | 401/400 | PENDING |
| S4-02 | Download API rejects unauthenticated | 401/404 | PENDING |
| S5-01 | Favicon accessible | 200/404 | PENDING |
| S6-01 | Security headers present | headers set | PENDING |

---

## Manual Browser Tests

| ID | Test | Steps | Result |
|----|------|-------|--------|
| M1 | SSO login end-to-end | Click "Sign in with Microsoft" → Azure AD → redirect to /dashboard | PENDING |
| M2 | Dashboard role-based data | Login as different roles → verify scoped data | PENDING |
| M3 | Engagement scope | Manager: sees own engagements only; Chief: sees all | PENDING |
| M4 | Task signoff flows | Create task → complete → signoff → approve/reject/rework | PENDING |
| M5 | Planning gate + issuance gate | Transition ACTIVE→FIELDWORK; FINAL→ISSUED | PENDING |
| M6 | File upload via browser | Upload PDF on task detail → verify in attachments list | PENDING |
| M7 | File download | Click download → verify file opens, check response headers | PENDING |
| M8 | Locale VI/EN toggle | Click language switcher → all text changes, no mixed languages | PENDING |

---

## Instructions

1. Deploy to Vercel (see `UAT-ONLINE-SETUP.md`)
2. Run automated smoke test:
   ```bash
   UAT_URL=https://your-app.vercel.app node scripts/uat-online-smoke-test.mjs
   ```
3. Fill in results above
4. Perform manual browser tests (M1-M8)
5. Update this document with PASS/FAIL
6. Update `UAT-ONLINE-GO-NO-GO.md` with final decision
