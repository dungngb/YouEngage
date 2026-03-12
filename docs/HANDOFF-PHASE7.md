# Handoff Report — Phase 7: Workflow Logic Fixes + Control Gates

**Date:** 2026-03-11
**Status:** COMPLETE — 37/37 test cases pass, 0 open defects

---

## 1. Task Lock — Where and What

**Server enforcement locations:**

| File | Function | Lock Logic |
|------|----------|------------|
| `src/lib/actions/task.ts` | `updateTask()` | Blocks edits when status is PENDING_REVIEW or APPROVED |
| `src/lib/actions/task.ts` | `updateTaskStatus()` | Blocks manual status changes when PENDING_REVIEW or APPROVED |
| `src/lib/actions/task.ts` | `deleteTask()` | Blocks deletion when PENDING_REVIEW or APPROVED |

**What is blocked:**
- Title, description, type, assignee, dueDate changes (updateTask)
- Manual status transitions via dropdown (updateTaskStatus)
- Task deletion (deleteTask)
- File upload/delete (UI hides buttons; server-side attachment lock for APPROVED was already present)

**What is NOT blocked (by design):**
- Signoff actions (approve, reject) — these are the legitimate way to change status
- Reopen task action (requires Manager role + reason)

---

## 2. Reopen Task Flow

**Who:** Manager, Chief Auditor, Admin only (assertManagerRole check)

**How:**
1. Manager clicks "Mở lại task (Reopen)" button on APPROVED or PENDING_REVIEW task
2. Enters mandatory reason in textarea
3. Confirms → `reopenTask()` server action executes:
   - Creates a REVIEWER/REJECTED signoff record with comment `[REOPEN] {reason}`
   - Updates task status to `IN_PROGRESS`
   - Logs `task.reopen` audit action with from/to/reason details

**Status transition:** PENDING_REVIEW → IN_PROGRESS, or APPROVED → IN_PROGRESS

**Signoff invalidation:** A rejection signoff record is created to mark the cycle as voided. The signoff history shows the reopen event clearly.

---

## 3. Rework Loop Enforcement

**Server enforcement in `src/lib/actions/signoff.ts`:**

`preparerSignoff()` now checks:
```
if (task.status !== "COMPLETED") → throw error
```

Previously allowed `COMPLETED || REJECTED`. Now strictly `COMPLETED` only.

**Enforced flow:**
```
REJECTED → (auditor changes to COMPLETED) → preparerSignoff → PENDING_REVIEW → approve/reject
```

**UI guidance:** When task is REJECTED, the SignoffActions component shows:
> "Task đã bị từ chối. Sau khi rework xong, chuyển trạng thái về Hoàn thành để thực hiện preparer signoff lại."

---

## 4. Planning Gate (ACTIVE → FIELDWORK)

**Location:** `src/lib/actions/engagement.ts`, inside `updateEngagementStatus()`

**Validations:**
1. `description` (objective) must not be null/empty
2. `scope` must not be null/empty
3. At least 1 engagement member with manager-level role (looks up User → Role → name)
4. At least 1 engagement member with "auditor" role
5. At least 1 task exists in the engagement

**Error format:** Aggregated bullet-point list, e.g.:
```
Chưa đủ điều kiện chuyển sang Fieldwork:
• Mục tiêu (description) không được để trống
• Phạm vi (scope) không được để trống
• Engagement phải có ít nhất 1 task
```

**Role lookup method:** Fetches member userId list → User.roleId → Role.name to determine actual role. Does NOT rely on EngagementMember.role field (which is "lead"/"member").

---

## 5. Report Issuance Gate (FINAL → ISSUED)

**Location:** `src/lib/actions/report.ts`, inside `updateReportStatus()`

**Validations:**
1. Engagement status must be `REPORTING`
2. Engagement must have ≥1 task
3. All tasks must have status `APPROVED`

**Error format:** Same aggregated bullet-point pattern.

---

## 6. Test Results

37 test cases defined in `docs/UAT-PHASE7.md`:

| Category | Tests | Result |
|----------|-------|--------|
| A1: Task Lock | 8 | ALL PASS |
| A1-Reopen | 5 | ALL PASS |
| A2: Rework Loop | 5 | ALL PASS |
| B1: Planning Gate | 7 | ALL PASS |
| B2: Report Gate | 4 | ALL PASS |
| B3: Rollback Reason | 5 | ALL PASS |
| C: Audit Log | 3 | ALL PASS |

TypeScript compilation: 0 errors.

---

## 7. Side Effects on Seed Data / UAT Scripts

**No breaking side effects.** Specifically:

- **Schema:** No changes. No new migrations needed.
- **Seed data:** Existing seed scripts unaffected. If seed creates engagements that transition ACTIVE→FIELDWORK, those engagements must now have description, scope, manager member, auditor member, and ≥1 task.
- **Existing data:** Tasks already in PENDING_REVIEW or APPROVED will now be properly locked. This is the intended behavior fix.
- **Backward-compatible API:** `updateEngagementStatus()` and `updateReportStatus()` accept an optional `reason` parameter — existing callers without reason still work for forward transitions.

---

## Files Changed

```
src/lib/actions/task.ts          — Lock checks + reopenTask()
src/lib/actions/signoff.ts       — preparerSignoff COMPLETED-only
src/lib/actions/engagement.ts    — Planning gate + rollback reason
src/lib/actions/report.ts        — Issuance gate + rollback reason
src/lib/constants.ts             — New audit action labels
src/components/ui/signoff-actions.tsx       — Reopen UI + REJECTED guidance
src/components/ui/status-transition.tsx     — Rollback reason form
src/components/ui/report-status-transition.tsx — Rollback reason form
src/app/dashboard/engagements/[id]/tasks/[taskId]/page.tsx — Lock UI for PENDING_REVIEW
src/app/api/upload/route.ts      — Lock upload for PENDING_REVIEW tasks
docs/PHASE7-CHANGES.md           — Change documentation
docs/UAT-PHASE7.md               — Test cases
docs/HANDOFF-PHASE7.md           — This file
```

---

## Remaining Gaps

1. **Finding status rollback reason** — Not implemented (finding backward transitions are less common; can add in future if needed)
2. **Task edit page** — No separate edit page exists; task editing is inline on detail page (already locked)
3. **Attachment server-side lock for PENDING_REVIEW** — FIXED. Upload route (`src/app/api/upload/route.ts`) and deleteAttachment action now both check PENDING_REVIEW in addition to APPROVED.
4. **Engagement objective field** — Planning gate uses `description` field as "objective". A dedicated `objective` field could be added later for clarity.
