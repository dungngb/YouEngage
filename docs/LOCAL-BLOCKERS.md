# Local Dev — Blockers & Issues

**Date**: 2026-03-11 (Updated post-Phase 7)

## Status: NO BLOCKERS

All 60 tests pass. No blockers identified for Phase 2 UAT Online.

---

## Known Limitations (Non-Blocking)

### 1. SSO Not Tested Locally
- **Impact:** Low — Dev login validates all auth flows except OAuth redirect
- **Workaround:** `DEV_AUTH=true` with CredentialsProvider
- **Resolution:** Phase 2 UAT Online with real Azure AD credentials

### 2. Next.js Dev Mode HTTP Status Codes
- **Issue:** `notFound()` returns HTTP 200 (not 404) in dev mode
- **Impact:** None — production build returns correct 404
- **Workaround:** Test checks response body for "not-found" content

### 3. No Local PostgreSQL
- **Issue:** Dev workstation has no Docker or native PostgreSQL
- **Impact:** None — Neon cloud database used successfully
- **Workaround:** Using existing Neon database with SSL connection

### 4. File Upload Not Tested via HTTP
- **Issue:** Multipart upload via automated test script is complex
- **Impact:** Low — upload route auth check verified, file handling tested in Phase 6
- **Resolution:** Manual browser testing confirms upload works; Phase 2 UAT will include full file flow
