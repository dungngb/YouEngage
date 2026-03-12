# Phase 3 Handoff Report — Scope Hardening + Workflow Closure + UAT Readiness

**Date**: 2026-03-04
**Build status**: PASS (21 routes)

---

## 1. Routes Modified (Query-Level Authorization)

| Route | File | Change |
|---|---|---|
| `/dashboard` | `src/app/dashboard/page.tsx` | All 4 Prisma queries now scoped via `engagementScopeFilter` / `engagementChildScopeFilter` |
| `/dashboard/engagements` | `src/app/dashboard/engagements/page.tsx` | `findMany` filtered by `engagementScopeFilter` |
| `/dashboard/findings` | `src/app/dashboard/findings/page.tsx` | `findMany` filtered by `engagementChildScopeFilter` |
| `/dashboard/reports` | `src/app/dashboard/reports/page.tsx` | `findMany` filtered by `engagementChildScopeFilter` |
| `/dashboard/documents` | `src/app/dashboard/documents/page.tsx` | Attachments filtered by `engagementChildScopeFilter`; engagement dropdown filtered by `engagementScopeFilter` |

### Scope Logic

- **admin / chief_auditor**: No filter applied — see all data across all engagements
- **manager / auditor**: Only see data from engagements where they are a member (`EngagementMember` lookup)

Helper functions added to `src/lib/authorization.ts`:
- `engagementScopeFilter(userId, role)` → returns `{ id: { in: [...] } }` for Engagement queries
- `engagementChildScopeFilter(userId, role)` → returns `{ engagementId: { in: [...] } }` for Task/Finding/Report/Attachment queries

---

## 2. Engagement Close Validation

**File**: `src/lib/actions/engagement.ts` — `updateEngagementStatus()`

When transitioning to `CLOSED`:
1. Counts all tasks in the engagement via `prisma.task.groupBy`
2. **Blocks if zero tasks** — "Engagement chua co task nao — khong the dong"
3. **Blocks if any task not APPROVED** — "Con X task chua duoc duyet (APPROVED). Hoan thanh signoff tat ca task truoc khi dong engagement."

---

## 3. Status Transition Review

### Engagement: DRAFT → ACTIVE → FIELDWORK → REPORTING → CLOSED
- Forward + backward transitions allowed (except from CLOSED)
- CLOSED requires ALL tasks APPROVED (new in Phase 3)
- Only manager/chief_auditor/admin can transition

### Task: TODO → IN_PROGRESS → COMPLETED → PENDING_REVIEW → APPROVED / REJECTED
- REJECTED → rework loop back to TODO/IN_PROGRESS
- Signoff actions enforce preparer != reviewer
- APPROVED = locked (no file upload/delete)

### Report: DRAFT → REVIEW → FINAL → ISSUED
- ISSUED = permanently locked (no edit, no delete, no attachment changes)
- Only manager/chief_auditor/admin can manage reports

### Finding: OPEN → IN_PROGRESS → REMEDIATED → CLOSED
- CLOSED requires: (1) REMEDIATED status, (2) manager/chief_auditor role, (3) >= 1 attachment
- CLOSED findings: no file upload, no edit, no delete

**No bypass found** — all transitions validated server-side in actions, not just in UI.

---

## 4. Permission Matrix (Verified)

| Action | Auditor | Manager | Chief Auditor | Admin |
|---|---|---|---|---|
| View engagements | Own only | Own only | All | All |
| Create engagement | No | Yes | Yes | Yes |
| Edit engagement | No | Yes (member) | Yes (member) | Yes |
| Delete engagement (DRAFT only) | No | Yes (member) | Yes (member) | Yes |
| Transition engagement status | No | Yes (member) | Yes (member) | Yes |
| View tasks/findings/reports | Own engagements | Own engagements | All | All |
| Create task | No | Yes (member) | Yes (member) | Yes |
| Edit/assign task | Assignee only | Yes (member) | Yes (member) | Yes |
| Preparer signoff | Assignee | Assignee | Assignee | Assignee |
| Reviewer signoff | No (preparer!=reviewer) | Yes (member) | Yes (member) | Yes |
| Create report | No | Yes (member) | Yes (member) | Yes |
| Create finding | Yes (member) | Yes (member) | Yes (member) | Yes |
| Close finding | No | Yes (member) | Yes (member) | Yes |
| Upload file | Yes (member) | Yes (member) | Yes (member) | Yes |
| Download file | Yes (member) | Yes (member) | Yes (member) | Yes |
| View dashboard | Own data | Own data | All data | All data |
| View documents | Own engagements | Own engagements | All | All |

---

## 5. UAT Seed Data

**File**: `prisma/seed.ts`

### Demo Users (6)
| Email | Name | Role |
|---|---|---|
| chief@demo.local | Nguyen Van An | chief_auditor |
| manager1@demo.local | Tran Thi Binh | manager |
| manager2@demo.local | Le Van Cuong | manager |
| auditor1@demo.local | Pham Minh Duc | auditor |
| auditor2@demo.local | Hoang Thi Em | auditor |
| auditor3@demo.local | Vo Van Phat | auditor |

### Demo Engagements (3)
| ID | Name | Status | Lead | Members |
|---|---|---|---|---|
| demo-eng-fieldwork | Kiem toan Quy trinh Mua hang 2026 | FIELDWORK | manager1 | auditor1, auditor2 |
| demo-eng-draft | Kiem toan CNTT 2026 | DRAFT | manager2 | auditor3 |
| demo-eng-reporting | Kiem toan Nhan su Q1/2026 | REPORTING | manager1 | auditor2 |

### Demo Content
- **3 tasks** in eng-fieldwork: 1 APPROVED, 1 PENDING_REVIEW, 1 IN_PROGRESS
- **2 tasks** in eng-reporting: both APPROVED (ready for close demo)
- **3 findings**: 1 OPEN (HIGH), 1 IN_PROGRESS (MEDIUM), 1 REMEDIATED (LOW)
- **1 report** in eng-reporting: REVIEW status
- **3 signoffs**: 2 for task1 (preparer+reviewer), 1 for task2 (preparer only)

### UAT Scenarios Enabled
1. **Login as chief_auditor** → see all 3 engagements on dashboard
2. **Login as manager2** → only see eng-draft (scoped!)
3. **Login as auditor3** → only see eng-draft
4. **Login as auditor1** → see eng-fieldwork, assigned tasks
5. **Try close eng-fieldwork** → blocked (2 tasks not APPROVED)
6. **Try close eng-reporting** → allowed (all tasks APPROVED)
7. **Review task2 in eng-fieldwork** → reviewer signoff flow
8. **Close finding-3** → requires manager role + REMEDIATED + attachment

---

## 6. Remaining Gaps (Future Phases)

| Gap | Priority | Notes |
|---|---|---|
| Detail pages (engagement/task/finding/report) access control | Medium | Currently membership check is on mutations only, not on detail page read |
| Password/credential login for demo users | Low | Demo users have no auth provider — SSO only currently |
| Audit log viewer UI | Medium | AuditLog table exists but no browse UI |
| Export reports to PDF/DOCX | Low | Phase 4+ |
| Email notifications | Low | Phase 4+ |
| Bulk task operations | Low | Phase 4+ |
