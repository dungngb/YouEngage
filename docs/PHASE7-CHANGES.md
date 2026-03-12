# Phase 7 — Workflow Logic Fixes + Control Gates

## Overview
Phase 7 hardens the audit workflow with server-side enforcement of task locks, proper rework loops, planning/reporting gates, and rollback reasons. No new modules or schema changes.

---

## A. P0 — Logic Fixes (BẮT BUỘC)

### A1) Task Lock when PENDING_REVIEW or APPROVED

**Server-side enforcement in `src/lib/actions/task.ts`:**

- `updateTask()` (line ~117): Throws error if task status is `PENDING_REVIEW` or `APPROVED`
- `updateTaskStatus()` (line ~218): Throws error if task status is `PENDING_REVIEW` or `APPROVED`
- `deleteTask()` (line ~280): Now blocks both `APPROVED` and `PENDING_REVIEW` (was only APPROVED)

**Exception — `reopenTask()` (new action, line ~297):**
- Only Manager/Chief Auditor/Admin can reopen
- Requires mandatory reason (comment)
- Accepts tasks in `PENDING_REVIEW` or `APPROVED` status
- Sets task back to `IN_PROGRESS`
- Creates a REVIEWER/REJECTED signoff record with `[REOPEN]` prefix to invalidate the cycle
- Logs `task.reopen` audit action

**UI changes:**
- `signoff-actions.tsx`: Added Reopen button (amber) for managers on APPROVED and PENDING_REVIEW tasks, with reason form
- `task-status-select.tsx`: Already hides for PENDING_REVIEW/APPROVED (no change needed)
- Task detail page: File upload/delete buttons now also hidden for PENDING_REVIEW (was only APPROVED)

### A2) Rework Loop Fix

**Server-side in `src/lib/actions/signoff.ts`:**
- `preparerSignoff()` now ONLY allows `COMPLETED` status (removed `REJECTED`)
- Error message guides user: "Vui lòng chuyển task về Hoàn thành sau khi rework xong"

**New rework flow:**
1. Reviewer rejects → task becomes `REJECTED`
2. Auditor works on task → changes status to `COMPLETED` via TaskStatusSelect
3. Auditor does preparer signoff → task becomes `PENDING_REVIEW`
4. Reviewer approves/rejects as before

**UI changes:**
- `signoff-actions.tsx`:
  - `canPrepareSignoff` changed from `COMPLETED || REJECTED` to `COMPLETED` only
  - Added REJECTED guidance message: "chuyển trạng thái về Hoàn thành để thực hiện preparer signoff lại"
  - Removed conditional REJECTED message from preparer signoff section

---

## B. P1 — Control Gates (RẤT NÊN)

### B1) Planning Gate: ACTIVE → FIELDWORK

**Server-side in `src/lib/actions/engagement.ts` (`updateEngagementStatus`):**

Validates before allowing transition to FIELDWORK:
1. `description` (objective) must not be empty
2. `scope` must not be empty
3. At least 1 member with manager-level role (manager/chief_auditor/admin)
4. At least 1 member with auditor role
5. At least 1 task in the engagement

If validation fails: throws error with bullet-point list of all issues.

### B2) Report Issuance Gate: FINAL → ISSUED

**Server-side in `src/lib/actions/report.ts` (`updateReportStatus`):**

Validates before allowing transition to ISSUED:
1. Engagement status must be `REPORTING`
2. Engagement must have at least 1 task
3. All tasks must be `APPROVED`

If validation fails: throws error with bullet-point list of all issues.

### B3) Status Rollback Reason

**Engagement rollback (`src/lib/actions/engagement.ts`):**
- Backward transitions (e.g., FIELDWORK → ACTIVE) require a non-empty `reason`
- Audit log uses action `engagement.status_rollback` (vs `engagement.status_change` for forward)
- Reason stored in audit log details

**Report rollback (`src/lib/actions/report.ts`):**
- Same pattern: backward transitions require reason
- Audit log uses `report.status_rollback`

**UI changes:**
- `status-transition.tsx`: Backward buttons now open a reason form (textarea) instead of transitioning immediately
- `report-status-transition.tsx`: Same pattern — backward button opens reason form

---

## C. Audit Log & Activity

### New audit log action labels (`src/lib/constants.ts`):
- `task.reopen`: "Mở lại task"
- `task.assignment_change`: "Thay đổi phân công task"
- `engagement.status_rollback`: "Quay lại trạng thái engagement"
- `report.status_rollback`: "Quay lại trạng thái báo cáo"
- `engagement.delete`: "Xóa engagement"
- `finding.delete`: "Xóa finding"

Activity timeline (`/dashboard/engagements/[id]/activity`) auto-displays these new actions.

---

## Affected Files

| File | Changes |
|------|---------|
| `src/lib/actions/task.ts` | Lock checks in updateTask/updateTaskStatus/deleteTask, new reopenTask() |
| `src/lib/actions/signoff.ts` | preparerSignoff only from COMPLETED |
| `src/lib/actions/engagement.ts` | Planning gate, rollback reason, updated audit log |
| `src/lib/actions/report.ts` | Issuance gate, rollback reason, updated audit log |
| `src/lib/constants.ts` | New audit action labels |
| `src/components/ui/signoff-actions.tsx` | Reopen button, REJECTED guidance, removed REJECTED from preparer |
| `src/components/ui/status-transition.tsx` | Rollback reason form |
| `src/components/ui/report-status-transition.tsx` | Rollback reason form |
| `src/app/dashboard/engagements/[id]/tasks/[taskId]/page.tsx` | Lock file upload/delete for PENDING_REVIEW |

No schema changes. No new migrations needed.
