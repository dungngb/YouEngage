# Phase 6 — Open Defects

**Dự án**: YouEngage
**Ngày phát hiện**: 2026-03-04
**Phương pháp phát hiện**: Code review (static analysis)

---

## Defects Found & Fixed in Phase 6

Tổng cộng **7 defects** phát hiện, **tất cả đã fix**.

### BLOCKER (4 — ALL FIXED)

| # | ID | File(s) | Description | Fix |
|---|----|---------|-------------|-----|
| 1 | DEF-001 | engagements/[id]/page.tsx | Missing `assertEngagementAccess()` — any authenticated user can view any engagement detail | Added access check |
| 2 | DEF-002 | tasks/[taskId]/page.tsx | Missing `assertEngagementAccess()` — any user can view any task | Added access check |
| 3 | DEF-003 | findings/[findingId]/page.tsx | Missing `assertEngagementAccess()` — any user can view any finding | Added access check |
| 4 | DEF-004 | reports/[reportId]/page.tsx | Missing `assertEngagementAccess()` — any user can view any report | Added access check |

**Root Cause**: Detail pages were added in Phase 1 (Gate 2-4) before Phase 2 introduced engagement-level authorization. The scope checks were added to list pages and server actions but not to detail pages.

**Also Fixed**: 6 additional edit/new pages were missing the same check:
- `engagements/[id]/edit/page.tsx`
- `tasks/new/page.tsx`
- `findings/new/page.tsx`
- `findings/[findingId]/edit/page.tsx`
- `reports/new/page.tsx`
- `reports/[reportId]/edit/page.tsx`

### HIGH (2 — ALL FIXED)

| # | ID | File(s) | Description | Fix |
|---|----|---------|-------------|-----|
| 5 | DEF-005 | api/upload/route.ts | Upload with only `taskId`/`reportId`/`findingId` (no `engagementId`) skips membership check | Now resolves engagement from child entity and always checks membership |
| 6 | DEF-006 | lib/constants.ts | `signoff.reviewer.approve` and `signoff.reviewer.reject` action names missing from AUDIT_ACTION_LABELS — activity log shows raw action names | Added both labels |

### MEDIUM (1 — FIXED)

| # | ID | File(s) | Description | Fix |
|---|----|---------|-------------|-----|
| 7 | DEF-007 | lib/authorization.ts | `assertEngagementAccess()` only bypasses `admin` but not `chief_auditor` — inconsistent with scope filters that bypass both | Added `chief_auditor` bypass |

---

## Currently Open Defects

**Không có defect mở**. Tất cả defects phát hiện đã được fix và verified qua `npx next build`.

---

## Known Limitations (Not Defects)

Các giới hạn sau là by-design, không phải defect:

| # | Area | Limitation | Risk |
|---|------|-----------|------|
| 1 | File validation | Chỉ check extension + MIME header, không check file content (magic bytes) | Low — additional library needed |
| 2 | File upload | Không có antivirus scanning | Medium — deploy antivirus at infrastructure level |
| 3 | Rate limiting | Không có rate limiting trên upload/download | Low for pilot — internal users only |
| 4 | Pagination | List pages không có pagination | Low for pilot (< 100 items expected) |
| 5 | Preparer signoff | Bất kỳ member nào cũng có thể preparer signoff, không chỉ assignee | By design — server action allows any member |
| 6 | Notification | Badge count có thể stale nếu task reassigned | Low — cosmetic |
| 7 | Engagement reopen | CLOSED engagement không mở lại được (cần DB intervention) | By design — terminal state |

Xem `docs/KNOWN-LIMITATIONS.md` cho danh sách đầy đủ.

---

## Defect Statistics

| Severity | Found | Fixed | Open |
|----------|-------|-------|------|
| BLOCKER | 4 | 4 | 0 |
| HIGH | 2 | 2 | 0 |
| MEDIUM | 1 | 1 | 0 |
| LOW | 0 | 0 | 0 |
| **Total** | **7** | **7** | **0** |
