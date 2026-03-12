# GATES LOG – YouEngage Phase 1

## Gate 1 – Project Setup & Auth

- **Mục tiêu**: Dựng nền tảng dự án, DB schema cơ bản, SSO login hoạt động, phân quyền role.
- **Ngày bắt đầu**: 2026-03-04
- **Ngày hoàn thành**: 2026-03-04
- **Trạng thái**: DONE
- **Deliverables**:
  - [x] Next.js 14 + TypeScript + Tailwind CSS 3 project initialized
  - [x] Docker Compose (PostgreSQL 16 + app)
  - [x] Prisma schema: User, Role, Account, Session, VerificationToken
  - [x] Microsoft SSO login/logout (Entra ID OIDC via NextAuth v5)
  - [x] Role-based middleware (public/protected/admin routes)
  - [x] Seed data (4 roles: chief_auditor, manager, auditor, admin)
  - [x] Login page with Microsoft SSO button
  - [x] Dashboard page with role-based content
  - [x] Sidebar navigation with role-based menu items
  - [x] Sign out functionality
  - [x] Dockerfile (multi-stage, standalone output)
  - [x] .env.example with SSO setup instructions
- **Bằng chứng**: `npx next build` passes, all routes compile successfully
- **Ghi chú**:
  - next-auth v5 beta: dùng `issuer` thay vì `tenantId` cho Microsoft Entra ID provider.
  - JWT strategy cho middleware Edge-compatible.
  - Server action phải tách file riêng khi dùng trong Client Component.

---

## Gate 2 – Engagement & Planning

- **Mục tiêu**: CRUD engagement, lifecycle management, team assignment, task/workpaper management, file upload.
- **Ngày bắt đầu**: 2026-03-04
- **Ngày hoàn thành**: 2026-03-04
- **Trạng thái**: DONE
- **Deliverables**:
  - [x] Prisma schema: Engagement, EngagementMember, Task, Attachment (with enums)
  - [x] Engagement CRUD — server actions + create/edit/list pages
  - [x] Engagement lifecycle state machine (DRAFT → ACTIVE → FIELDWORK → REPORTING → CLOSED)
  - [x] Team assignment UI — add/remove members, lead/member roles
  - [x] Task/Workpaper CRUD — server actions + create/detail pages
  - [x] File upload/download — API route /api/upload + /api/files/[id], local storage
  - [x] Task assignment to auditor — dropdown chọn member trong engagement
  - [x] Status badge + transition components
  - [x] Engagement detail page — overview, team, tasks, documents all in one view
  - [x] Task detail page — metadata, status change, file attachments
  - [x] Delete attachment with file cleanup
- **Bằng chứng**: `npx next build` passes, 12 routes compiled successfully
- **Ghi chú**:
  - Server actions trả về error object không tương thích với `<form action={}>` — dùng throw Error thay vì return { error }.
  - EngagementMember dùng @@unique([engagementId, userId]) để tránh duplicate.
  - File storage tổ chức theo engagementId subdirectory.

---

## Gate 3 – Execution & Signoff

- **Mục tiêu**: Auditor execution flow, signoff workflow (preparer → reviewer), reject/rework, audit trail.
- **Ngày bắt đầu**: 2026-03-04
- **Ngày hoàn thành**: 2026-03-04
- **Trạng thái**: DONE
- **Deliverables**:
  - [x] Prisma schema: Signoff (type, status, comment), AuditLog (immutable)
  - [x] TaskStatus enum extended: TODO → IN_PROGRESS → COMPLETED → PENDING_REVIEW → APPROVED / REJECTED
  - [x] Task execution UI (status select, upload evidence — from Gate 2, enhanced)
  - [x] Preparer signoff — server action with audit log
  - [x] Reviewer signoff (enforced: only after preparer signoff)
  - [x] Preparer ≠ Reviewer validation (hard-enforced in server action)
  - [x] Reject + review comment + rework loop (REJECTED → rework → re-signoff)
  - [x] Audit trail logging — AuditLog model + logAction helper
  - [x] Signoff history timeline on task detail page
  - [x] Step indicator (Thực hiện → Preparer → Reviewer) visualization
  - [x] Engagement detail updated with signoff-aware task stats
  - [x] Approved tasks: file upload/delete locked
- **Bằng chứng**: `npx next build` passes, all routes compiled
- **Ghi chú**:
  - Signoff statuses managed by signoff actions, not by manual TaskStatusSelect.
  - TaskStatusSelect hidden for PENDING_REVIEW and APPROVED states.
  - REJECTED tasks can re-enter preparer signoff after rework.

---

## Gate 4 – Reporting & Findings

- **Mục tiêu**: Report management (draft → lock), findings lifecycle, remediation follow-up.
- **Ngày bắt đầu**: 2026-03-04
- **Ngày hoàn thành**: 2026-03-04
- **Trạng thái**: DONE
- **Deliverables**:
  - [x] Prisma schema: Report (ReportStatus enum), Finding (FindingStatus, RiskRating enums)
  - [x] Report CRUD API + UI (create, edit, detail, list)
  - [x] Report lifecycle (Draft → Review → Final → Issued/Locked)
  - [x] Final report lock enforcement (ISSUED = locked — no edit, no delete, no attachment changes)
  - [x] Finding CRUD API + UI (create, edit, detail, global list, engagement-scoped list)
  - [x] Finding lifecycle (Open → In Progress → Remediated → Closed)
  - [x] Remediation evidence upload (via FileUpload component with findingId)
  - [x] Finding close validation (requires manager/chief_auditor + remediation evidence)
- **Bằng chứng**: `npx next build` passes, 20 routes compiled successfully
- **Ghi chú**:
  - Report status transitions: DRAFT↔REVIEW↔FINAL→ISSUED. ISSUED = permanently locked.
  - Finding close requires: (1) status REMEDIATED, (2) role manager/chief_auditor, (3) at least 1 attachment.
  - Attachment model extended with reportId and findingId foreign keys.
  - Global /dashboard/findings page with summary stats (open/in_progress/remediated/closed/high risk).
  - Global /dashboard/reports page for manager/chief_auditor overview.
  - All status changes logged to AuditLog.

---

## Gate 5 – Dashboard & Polish

- **Mục tiêu**: Dashboard cho lãnh đạo & manager, document repository, search, UAT readiness.
- **Ngày bắt đầu**: 2026-03-04
- **Ngày hoàn thành**: 2026-03-04
- **Trạng thái**: DONE
- **Deliverables**:
  - [x] Dashboard Trưởng ban (engagement overview table, findings summary sorted by risk, pending reviews)
  - [x] Dashboard Manager (pending review tasks, open findings)
  - [x] Dashboard Auditor (my assigned tasks)
  - [x] Real-time stats cards (active engagements, pending reviews, open findings, draft reports)
  - [x] Document repository (browse by engagement, search by filename, filter by category)
  - [x] Search documents by metadata (filename, engagement, category filters)
  - [x] Docker Compose production-ready config (named volumes, log rotation, configurable ports/passwords)
  - [x] UAT scenario: 18-step end-to-end workflow documented in README
  - [x] README setup & deployment guide (dev + production Docker, SSO config, backup/restore, update)
- **Bằng chứng**: `npx next build` passes, 21 routes compiled successfully
- **Ghi chú**:
  - Dashboard queries: 4 parallel Prisma calls for stats (engagements, tasks, findings, reports).
  - Document repository: search by filename (case-insensitive), filter by engagement and category, max 100 results.
  - Docker Compose: named volumes (youengage-pgdata, youengage-uploads), json-file logging with rotation.
  - README: comprehensive deployment guide with Azure Entra ID setup instructions, backup/restore commands.

---

## Phase 2 – Execution + Signoff Control Core

- **Muc tieu**: Server-side authorization, data-scope enforcement, audit log expansion.
- **Ngay hoan thanh**: 2026-03-04
- **Trang thai**: DONE
- **Deliverables**:
  - [x] `assertEngagementAccess()` + `assertManagerRole()` authorization helpers
  - [x] All server actions enforce engagement membership (data scope)
  - [x] Upload route: membership check + lock state checks
  - [x] Download route: membership check for file access
  - [x] Audit log expanded: 19 event types
  - [x] StatusTransition component updated to try/catch pattern

---

## Phase 3 – Scope Hardening + Workflow Closure + UAT Readiness

- **Muc tieu**: Query-level authorization, engagement close validation, UAT data.
- **Ngay hoan thanh**: 2026-03-04
- **Trang thai**: DONE
- **Deliverables**:
  - [x] `engagementScopeFilter()` + `engagementChildScopeFilter()` query-scope helpers
  - [x] Engagements list page: scoped by membership (auditor/manager see only theirs)
  - [x] Findings list page: scoped by engagement membership
  - [x] Reports list page: scoped by engagement membership
  - [x] Documents page: attachments + engagement dropdown scoped by membership
  - [x] Dashboard: all 4 queries scoped by engagement membership
  - [x] Engagement close validation: REPORTING→CLOSED blocked if any task not APPROVED
  - [x] Demo seed data: 6 users, 3 engagements, tasks, findings, reports, signoffs
- **Bang chung**: `npx next build` passes, 21 routes compiled successfully
