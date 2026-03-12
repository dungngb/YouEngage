# Phase 6 — UAT Results (Code Review-Based)

**Dự án**: YouEngage
**Phase**: 6 — Pre-Pilot Test & Verification
**Phương pháp**: Code review + build verification (không có runtime test)
**Ngày**: 2026-03-04

---

## 1. Functional Regression Test Results

### 1.1 Login / SSO

| # | Test Case | Result | Notes |
|---|-----------|--------|-------|
| 1 | Middleware redirects unauthenticated to /login | PASS | middleware.ts: checks `!req.auth`, redirects |
| 2 | Public paths (/login, /api/auth) accessible | PASS | publicPaths array check |
| 3 | JWT session strategy | PASS | auth.ts: `session: { strategy: "jwt" }` |
| 4 | New user gets auditor role | PASS | events.createUser assigns auditor role |
| 5 | User role loaded into session | PASS | jwt callback fetches from DB |

### 1.2 Dashboard

| # | Test Case | Result | Notes |
|---|-----------|--------|-------|
| 1 | Redirect to /login if no session | PASS | `redirect("/login")` |
| 2 | Stats cards show correct data | PASS | 4 parallel queries, correct filters |
| 3 | Chief Auditor sees engagement overview | PASS | role check in JSX |
| 4 | Manager sees pending reviews | PASS | `pendingReviewTasks` filter |
| 5 | Auditor sees "my tasks" only | PASS | `assigneeId === userId` filter |
| 6 | Data scoped to user's engagements | PASS | engagementScopeFilter + engagementChildScopeFilter |

### 1.3 Engagement Lifecycle

| # | Test Case | Result | Notes |
|---|-----------|--------|-------|
| 1 | Create engagement (manager+) | PASS | assertManagerRole check |
| 2 | Update engagement (manager+, member) | PASS | assertManagerRole + assertEngagementAccess |
| 3 | Status transitions (DRAFT→ACTIVE→FIELDWORK→REPORTING→CLOSED) | PASS | VALID_TRANSITIONS map |
| 4 | Backward transitions allowed (ACTIVE→DRAFT, etc.) | PASS | Included in transitions map |
| 5 | CLOSED is terminal (no transitions) | PASS | CLOSED: [] |
| 6 | Close requires all tasks APPROVED | PASS | groupBy + count validation |
| 7 | Close requires ≥1 task | PASS | totalTasks === 0 check |
| 8 | Delete only DRAFT engagements | PASS | status !== DRAFT throws |
| 9 | Creator auto-added as "lead" member | PASS | members.create in engagement.create |
| 10 | Audit log on all operations | PASS | logAction calls verified |

### 1.4 Task/Workpaper Lifecycle

| # | Test Case | Result | Notes |
|---|-----------|--------|-------|
| 1 | Create task (manager+, member) | PASS | assertManagerRole + assertEngagementAccess |
| 2 | Manual status changes (TODO→IN_PROGRESS→COMPLETED) | PASS | updateTaskStatus action |
| 3 | Status select hidden for PENDING_REVIEW/APPROVED | PASS | inSignoffFlow check |
| 4 | REJECTED shows select with rework option | PASS | Special handling in TaskStatusSelect |
| 5 | Delete task (manager+, not APPROVED) | PASS | Checks status before delete |
| 6 | Assignee validation (must be member) | PASS | EngagementMember check |

### 1.5 Signoff Workflow

| # | Test Case | Result | Notes |
|---|-----------|--------|-------|
| 1 | Preparer signoff (COMPLETED/REJECTED → PENDING_REVIEW) | PASS | Status check + Signoff record |
| 2 | Reviewer approve (PENDING_REVIEW → APPROVED) | PASS | Manager+ role check |
| 3 | Reviewer reject (PENDING_REVIEW → REJECTED) | PASS | Requires comment |
| 4 | Preparer ≠ Reviewer enforced | PASS | signedById comparison |
| 5 | Reject requires comment | PASS | `!comment || comment.trim().length === 0` |
| 6 | Rework loop (REJECTED → COMPLETED → preparer → PENDING_REVIEW) | PASS | Preparer accepts REJECTED status |

### 1.6 Report Lifecycle

| # | Test Case | Result | Notes |
|---|-----------|--------|-------|
| 1 | Create report (manager+, member) | PASS | assertManagerRole + assertEngagementAccess |
| 2 | Report transitions (DRAFT→REVIEW→FINAL→ISSUED) | PASS | VALID_TRANSITIONS map |
| 3 | ISSUED is terminal | PASS | ISSUED: [] |
| 4 | Cannot edit ISSUED report | PASS | Status check in updateReport |
| 5 | Cannot delete ISSUED report | PASS | Status check in deleteReport |
| 6 | Upload locked on ISSUED report | PASS | Upload route checks report.status |

### 1.7 Finding Lifecycle

| # | Test Case | Result | Notes |
|---|-----------|--------|-------|
| 1 | Create finding (any member) | PASS | assertEngagementAccess only |
| 2 | Finding transitions (OPEN→IN_PROGRESS→REMEDIATED→CLOSED) | PASS | VALID_TRANSITIONS map |
| 3 | Close validation: REMEDIATED status | PASS | Checked by transition map |
| 4 | Close validation: manager+ role | PASS | Role check in updateFindingStatus |
| 5 | Close validation: ≥1 attachment | PASS | _count.attachments check |
| 6 | Cannot edit CLOSED finding | PASS | Status check in updateFinding |
| 7 | Cannot delete CLOSED finding | PASS | Status check in deleteFinding |
| 8 | Upload locked on CLOSED finding | PASS | Upload route checks finding.status |

### 1.8 Upload / Download / Delete

| # | Test Case | Result | Notes |
|---|-----------|--------|-------|
| 1 | Upload with valid file type | PASS | Extension allowlist |
| 2 | Upload rejected for .exe | PASS | ALLOWED_FILE_EXTENSIONS check |
| 3 | Upload rejected for double-extension | PASS | hasDoubleExtension() |
| 4 | MIME cross-validation | PASS | ALLOWED_MIME_TYPES check |
| 5 | Filename sanitization | PASS | sanitizeFilename() |
| 6 | File size limit (50MB) | PASS | Client + server check |
| 7 | UUID storage naming | PASS | crypto.randomUUID() |
| 8 | Download with security headers | PASS | nosniff, CSP, Cache-Control |
| 9 | Path traversal prevention (download) | PASS | path.resolve + prefix check |
| 10 | Path traversal prevention (delete) | PASS | path.resolve + prefix check |
| 11 | Delete removes file + DB record | PASS | fs.unlink + prisma.delete |
| 12 | Membership check on upload | PASS | **Fixed in Phase 6** — resolves engagement from child entities |
| 13 | Membership check on download | PASS | Checks attachment.engagementId |

### 1.9 Document Repository

| # | Test Case | Result | Notes |
|---|-----------|--------|-------|
| 1 | Search by filename | PASS | `contains` filter, mode insensitive |
| 2 | Filter by engagement | PASS | Where clause |
| 3 | Filter by category | PASS | Where clause |
| 4 | Data scoped to user | PASS | engagementChildScopeFilter |

### 1.10 Activity Log

| # | Test Case | Result | Notes |
|---|-----------|--------|-------|
| 1 | Shows engagement + child entity logs | PASS | entityId IN filter |
| 2 | Action labels in Vietnamese | PASS | AUDIT_ACTION_LABELS map (**Fixed** — added missing reviewer.approve/reject) |
| 3 | Membership check | PASS | assertEngagementAccess |

---

## 2. UAT Rehearsal by Role

### 2.1 Chief Auditor

| # | Scenario | Result | Notes |
|---|----------|--------|-------|
| 1 | Login → Dashboard shows engagement overview | PASS | role check, scope = all |
| 2 | View all engagements (no scope restriction) | PASS | engagementScopeFilter returns {} |
| 3 | View engagement detail (any) | PASS | **Fixed** — assertEngagementAccess bypasses chief_auditor |
| 4 | View open findings across all engagements | PASS | engagementChildScopeFilter returns {} |
| 5 | View pending review tasks | PASS | Dashboard section |
| 6 | Reviewer signoff | PASS | role = chief_auditor passes manager check |
| 7 | Close finding | PASS | role check passes |

### 2.2 Manager

| # | Scenario | Result | Notes |
|---|----------|--------|-------|
| 1 | Dashboard shows pending reviews + open findings | PASS | role-based sections |
| 2 | Create engagement → auto-added as lead | PASS | members.create |
| 3 | Add team members | PASS | addEngagementMember |
| 4 | Create tasks, assign to auditor | PASS | createTask |
| 5 | Transition engagement status | PASS | updateEngagementStatus |
| 6 | Reviewer signoff (approve/reject) | PASS | reviewerSignoff/rejectSignoff |
| 7 | Create report, lifecycle to ISSUED | PASS | Report CRUD + transitions |
| 8 | Close finding | PASS | findingClose validation |
| 9 | Close engagement (all tasks APPROVED) | PASS | Validation logic |
| 10 | Cannot access other team's engagement | PASS | **Fixed** — assertEngagementAccess on pages |

### 2.3 Auditor

| # | Scenario | Result | Notes |
|---|----------|--------|-------|
| 1 | Dashboard shows "my tasks" | PASS | assigneeId filter |
| 2 | Update task status (TODO → IN_PROGRESS → COMPLETED) | PASS | TaskStatusSelect |
| 3 | Upload evidence files | PASS | FileUpload component |
| 4 | Preparer signoff | PASS | preparerSignoff action |
| 5 | Create finding | PASS | Any member can create |
| 6 | Cannot create engagement/task/report | PASS | assertManagerRole blocks |
| 7 | Cannot reviewer signoff | PASS | role check in reviewerSignoff |
| 8 | Cannot access other team's data | PASS | **Fixed** — page-level access checks |
| 9 | List pages scoped to own engagements | PASS | engagementScopeFilter |

---

## 3. Summary

| Area | Total Tests | Pass | Fail |
|------|------------|------|------|
| Functional Regression | 58 | 58 | 0 |
| UAT Chief Auditor | 7 | 7 | 0 |
| UAT Manager | 10 | 10 | 0 |
| UAT Auditor | 9 | 9 | 0 |
| **Total** | **84** | **84** | **0** |

**Lưu ý**: Tất cả defects tìm thấy trong Phase 6 đã được fix trước khi hoàn tất test results. Xem OPEN-DEFECTS.md cho danh sách chi tiết.
