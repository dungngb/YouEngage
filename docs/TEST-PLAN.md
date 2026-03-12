# Phase 6 — Test Plan

**Dự án**: YouEngage — Internal Audit Workflow Management
**Phase**: 6 — Pre-Pilot Test & Verification
**Ngày**: 2026-03-04

---

## 1. Mục tiêu

Xác nhận hệ thống đủ an toàn, ổn định, và đúng nghiệp vụ cho internal pilot.

## 2. Phương pháp kiểm tra

### 2.1 Code Review (Static Analysis)

Đọc và phân tích toàn bộ source code quan trọng:
- **Server Actions** (5 files): engagement, task, signoff, report, finding
- **API Routes** (3 files): upload, download, auth
- **Authorization** (1 file): assertEngagementAccess, assertManagerRole, scope filters
- **Middleware** (1 file): route protection
- **Detail Pages** (10+ files): engagement, task, finding, report detail + edit/new pages
- **Client Components** (8 files): signoff-actions, file-upload, status-transition, etc.
- **Constants** (1 file): file upload, audit labels, status labels

**Tool**: Manual code review, tracing mọi code path cho authorization, data scope, workflow rules, và XSS.

### 2.2 Build Verification

- `npx next build` — verify TypeScript compilation, type checking, lint
- Confirm tất cả routes compile thành công

### 2.3 Functional Verification

Kiểm tra logic theo code path, không chạy runtime test do thiếu test framework (project chưa setup Jest/Vitest).

**Giới hạn**: Không có automated test. Không có runtime test server. Kết quả dựa trên code review analysis — xác nhận logic đúng hoặc phát hiện lỗi logic qua đọc code.

---

## 3. Phạm vi Test

### 3.1 Functional Regression (8 modules)

| # | Test Area | Files Reviewed | Method |
|---|-----------|---------------|--------|
| 1 | Login / SSO | auth.ts, auth.config.ts, middleware.ts, login/page.tsx | Code review |
| 2 | Dashboard | dashboard/page.tsx, layout.tsx, notifications.ts | Code review |
| 3 | Engagement Lifecycle | engagement.ts (actions), status-transition.tsx | Code review |
| 4 | Task/Workpaper Lifecycle | task.ts (actions), task-status-select.tsx | Code review |
| 5 | Preparer Signoff | signoff.ts (preparerSignoff), signoff-actions.tsx | Code review |
| 6 | Reviewer Approve/Reject | signoff.ts (reviewerSignoff, rejectSignoff) | Code review |
| 7 | Report Lifecycle | report.ts (actions), report-status-transition.tsx | Code review |
| 8 | Finding Lifecycle | finding.ts (actions), finding-status-transition.tsx | Code review |
| 9 | Upload/Download/Delete | upload/route.ts, files/[id]/route.ts, deleteAttachment | Code review |
| 10 | Document Repository | documents/page.tsx | Code review |
| 11 | Activity Log | activity/page.tsx, audit-log.ts | Code review |

### 3.2 Authorization / RBAC / Data Scope

| # | Test | Method |
|---|------|--------|
| 1 | List-level scope (engagements, findings, reports, documents) | Code review: engagementScopeFilter, engagementChildScopeFilter |
| 2 | Detail page access control | Code review: assertEngagementAccess on all detail/edit/new pages |
| 3 | Server action access control | Code review: assertEngagementAccess + assertManagerRole in all actions |
| 4 | File upload/download/delete scope | Code review: membership check in upload route, download route, deleteAttachment |
| 5 | Role-based create/update/delete | Code review: assertManagerRole in engagement, task, report CRUD |
| 6 | Signoff role restrictions | Code review: reviewer must be manager+, preparer ≠ reviewer |

### 3.3 Workflow Control

| # | Test | Method |
|---|------|--------|
| 1 | Preparer ≠ Reviewer | Code review: signoff.ts line 110 |
| 2 | Reviewer chỉ sau preparer | Code review: task must be PENDING_REVIEW |
| 3 | Reject bắt buộc comment | Code review: signoff.ts line 166 |
| 4 | Issued report locked | Code review: report.ts, upload route, deleteAttachment |
| 5 | Closed finding locked | Code review: finding.ts, upload route, deleteAttachment |
| 6 | Finding close validation | Code review: REMEDIATED + manager+ + ≥1 attachment |
| 7 | Engagement close validation | Code review: all tasks APPROVED + ≥1 task |
| 8 | Upload/delete lock rules | Code review: upload route + deleteAttachment |

### 3.4 Security Verification

| # | Test | Method |
|---|------|--------|
| 1 | Unauthorized access | Code review: middleware, auth checks on all pages/actions |
| 2 | Direct object access | Code review: assertEngagementAccess on all pages |
| 3 | Upload MIME mismatch | Code review: ALLOWED_MIME_TYPES cross-validation |
| 4 | Double-extension | Code review: hasDoubleExtension() |
| 5 | Path traversal | Code review: path.resolve() + prefix check |
| 6 | XSS basic | Code review: no dangerouslySetInnerHTML, React auto-escaping |
| 7 | Download headers | Code review: nosniff, CSP, Cache-Control |
| 8 | Session behavior | Code review: JWT strategy, middleware redirect |

### 3.5 Performance

| # | Test | Method |
|---|------|--------|
| 1 | Dashboard queries | Code review: 4 parallel Prisma queries |
| 2 | List pages | Code review: scoped queries with take limits |
| 3 | File upload/download | Code review: streaming, size limits |
| 4 | Concurrent usage | N/A — no load testing tool available |

**Giới hạn**: Không có load testing framework. Performance review chỉ dựa trên phân tích code structure (query optimization, parallel queries, pagination limits).

### 3.6 Backup / Restore

| # | Test | Method |
|---|------|--------|
| 1 | DB backup | Code review: docker-compose.yml, README instructions |
| 2 | Upload backup | Code review: volume config, storage path |
| 3 | Restore verification | Documentation review only (no live environment) |

**Giới hạn**: Không có live environment để chạy thực tế. Verification chỉ dựa trên documentation review.

### 3.7 Deployment Smoke

| # | Test | Method |
|---|------|--------|
| 1 | Build passes | `npx next build` — verified |
| 2 | Docker config | Code review: Dockerfile, docker-compose.yml |
| 3 | Env config | Code review: .env.example completeness |
| 4 | Storage mount | Code review: UPLOAD_DIR config |

---

## 4. Defect Severity Levels

| Level | Định nghĩa |
|-------|-----------|
| BLOCKER | Lỗi nghiêm trọng, chặn pilot — phải fix trước khi deploy |
| HIGH | Lỗi quan trọng, ảnh hưởng security/data integrity — nên fix trước pilot |
| MEDIUM | Lỗi trung bình, ảnh hưởng accuracy nhưng không chặn pilot |
| LOW | Lỗi nhỏ, cosmetic hoặc minor UX issue |

## 5. Pass/Fail Criteria

- **GO**: Tất cả BLOCKER và HIGH đã fix. Không có defect mới ở mức BLOCKER/HIGH.
- **GO with conditions**: Có MEDIUM defects nhưng không ảnh hưởng core workflow.
- **NO-GO**: Có BLOCKER hoặc HIGH chưa fix.
