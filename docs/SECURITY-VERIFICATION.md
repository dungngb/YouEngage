# Phase 6 — Security Verification

**Dự án**: YouEngage
**Phương pháp**: Code review (static analysis)
**Ngày**: 2026-03-04

---

## 1. Authentication & Session

| # | Check | Result | Details |
|---|-------|--------|---------|
| 1 | All routes protected by middleware | PASS | middleware.ts intercepts all non-public paths |
| 2 | Unauthenticated → redirect to /login | PASS | `if (!req.auth)` check |
| 3 | Public paths correctly defined | PASS | `/login`, `/api/auth` only |
| 4 | JWT session strategy | PASS | `session: { strategy: "jwt" }` in auth.ts |
| 5 | Role stored in JWT token | PASS | jwt callback fetches from DB |
| 6 | Session expiration | PASS | Managed by NextAuth — default 30 days JWT |
| 7 | SSO-only authentication (no local login) | PASS | Only Microsoft Entra ID provider |

**Giới hạn**: Không test session hijacking, token theft, hoặc forced logout behavior — require live environment.

---

## 2. Authorization / RBAC

### 2.1 Page-Level Access Control

| # | Page | Auth Check | Scope Check | Result |
|---|------|-----------|-------------|--------|
| 1 | Dashboard | `redirect("/login")` | engagementScopeFilter | PASS |
| 2 | Engagements list | `redirect("/login")` | engagementScopeFilter | PASS |
| 3 | Engagement detail | session check | **assertEngagementAccess** | PASS (**Fixed Phase 6**) |
| 4 | Engagement edit | session + role | **assertEngagementAccess** | PASS (**Fixed Phase 6**) |
| 5 | Task detail | session check | **assertEngagementAccess** | PASS (**Fixed Phase 6**) |
| 6 | Task new | session + role | **assertEngagementAccess** | PASS (**Fixed Phase 6**) |
| 7 | Finding detail | session check | **assertEngagementAccess** | PASS (**Fixed Phase 6**) |
| 8 | Finding new | session check | **assertEngagementAccess** | PASS (**Fixed Phase 6**) |
| 9 | Finding edit | session check | **assertEngagementAccess** | PASS (**Fixed Phase 6**) |
| 10 | Report detail | session check | **assertEngagementAccess** | PASS (**Fixed Phase 6**) |
| 11 | Report new | session + role | **assertEngagementAccess** | PASS (**Fixed Phase 6**) |
| 12 | Report edit | session + role | **assertEngagementAccess** | PASS (**Fixed Phase 6**) |
| 13 | Activity log | session check | assertEngagementAccess | PASS (existing) |
| 14 | Findings list | `redirect("/login")` | engagementChildScopeFilter | PASS |
| 15 | Reports list | `redirect("/login")` | engagementChildScopeFilter | PASS |
| 16 | Documents | `redirect("/login")` | engagementChildScopeFilter | PASS |

### 2.2 Server Action Access Control

| # | Action | Auth | Role | Scope | Result |
|---|--------|------|------|-------|--------|
| 1 | createEngagement | session | manager+ | N/A (new) | PASS |
| 2 | updateEngagement | session | manager+ | assertEngagementAccess | PASS |
| 3 | updateEngagementStatus | session | manager+ | assertEngagementAccess | PASS |
| 4 | deleteEngagement | session | manager+ | assertEngagementAccess | PASS |
| 5 | addEngagementMember | session | manager+ | assertEngagementAccess | PASS |
| 6 | removeEngagementMember | session | manager+ | assertEngagementAccess | PASS |
| 7 | createTask | session | manager+ | assertEngagementAccess | PASS |
| 8 | updateTask | session | manager+/assignee | assertEngagementAccess | PASS |
| 9 | updateTaskStatus | session | manager+/assignee | assertEngagementAccess | PASS |
| 10 | deleteTask | session | manager+ | assertEngagementAccess | PASS |
| 11 | preparerSignoff | session | any member | assertEngagementAccess | PASS |
| 12 | reviewerSignoff | session | manager+ | assertEngagementAccess | PASS |
| 13 | rejectSignoff | session | manager+ | assertEngagementAccess | PASS |
| 14 | createReport | session | manager+ | assertEngagementAccess | PASS |
| 15 | updateReport | session | manager+ | assertEngagementAccess | PASS |
| 16 | updateReportStatus | session | manager+ | assertEngagementAccess | PASS |
| 17 | deleteReport | session | manager+ | assertEngagementAccess | PASS |
| 18 | createFinding | session | any member | assertEngagementAccess | PASS |
| 19 | updateFinding | session | any member | assertEngagementAccess | PASS |
| 20 | updateFindingStatus | session | any member (close: manager+) | assertEngagementAccess | PASS |
| 21 | deleteFinding | session | any member | assertEngagementAccess | PASS |
| 22 | deleteAttachment | session | any member | assertEngagementAccess | PASS |

### 2.3 API Route Access Control

| # | Route | Auth | Scope | Result |
|---|-------|------|-------|--------|
| 1 | POST /api/upload | session.user.id | membership check (resolved from child entities) | PASS (**Fixed Phase 6**) |
| 2 | GET /api/files/[id] | session.user.id | membership check on attachment.engagementId | PASS |

---

## 3. File Upload Security

| # | Check | Result | Implementation |
|---|-------|--------|---------------|
| 1 | Extension allowlist (14 types) | PASS | ALLOWED_FILE_EXTENSIONS in constants |
| 2 | MIME cross-validation | PASS | ALLOWED_MIME_TYPES map, extension vs Content-Type |
| 3 | Double-extension detection | PASS | hasDoubleExtension() — catches `file.pdf.exe` |
| 4 | Filename sanitization | PASS | sanitizeFilename() — strips `/`, `\`, null bytes, control chars |
| 5 | File size limit (50MB) | PASS | Client-side + server-side validation |
| 6 | UUID storage naming | PASS | crypto.randomUUID() — no user-controlled filenames on disk |
| 7 | Lock state enforcement | PASS | Cannot upload to approved task, issued report, closed finding |

**Giới hạn**:
- Không có magic-byte validation (chỉ kiểm tra extension + MIME header)
- Không có antivirus scanning
- Không có rate limiting

---

## 4. File Download Security

| # | Check | Result | Implementation |
|---|-------|--------|---------------|
| 1 | X-Content-Type-Options: nosniff | PASS | Prevents MIME sniffing |
| 2 | Content-Security-Policy: default-src 'none' | PASS | Blocks embedded scripts |
| 3 | Cache-Control: private, no-cache | PASS | Prevents proxy caching |
| 4 | Path traversal prevention | PASS | path.resolve() + startsWith check |
| 5 | Content-Disposition: attachment | PASS | Forces download (no inline execution) |
| 6 | Filename URL-encoded | PASS | encodeURIComponent() |

---

## 5. XSS Prevention

| # | Check | Result | Details |
|---|-------|--------|---------|
| 1 | No dangerouslySetInnerHTML | PASS | Not used anywhere in codebase |
| 2 | React auto-escaping | PASS | All user data rendered through JSX |
| 3 | No eval() or innerHTML | PASS | Not used |
| 4 | Form inputs use controlled components | PASS | React state or defaultValue |
| 5 | Server-side validation (Zod) | PASS | All form data validated before DB write |

---

## 6. Data Integrity

| # | Check | Result | Details |
|---|-------|--------|---------|
| 1 | Engagement ↔ child entity relationship | PASS | engagementId foreign key enforced |
| 2 | @@unique([engagementId, userId]) on members | PASS | Prevents duplicate assignments |
| 3 | Cascade delete on engagement | PASS | All children cascade |
| 4 | Audit log immutable | PASS | No update/delete API for AuditLog |
| 5 | Status transition validation | PASS | VALID_TRANSITIONS maps in all lifecycle actions |

---

## 7. Unauthorized Access Attempts (Code Path Analysis)

| # | Scenario | Expected | Actual (Code) | Result |
|---|----------|----------|---------------|--------|
| 1 | Unauthenticated user visits /dashboard | Redirect to /login | Middleware redirects | PASS |
| 2 | Auditor A accesses engagement B's detail page | 404 | assertEngagementAccess → notFound() | PASS |
| 3 | Auditor A calls server action on engagement B | Error | assertEngagementAccess throws | PASS |
| 4 | Auditor tries to create engagement | Error | assertManagerRole throws | PASS |
| 5 | Auditor tries reviewer signoff | Error | Role check throws | PASS |
| 6 | Same person does preparer + reviewer | Error | signedById check throws | PASS |
| 7 | Upload to task in other engagement (no engagementId) | Error | **Fixed** — resolves engagement from child entity | PASS |
| 8 | Download file from other engagement | 403 | Membership check on download route | PASS |

---

## 8. Summary

| Category | Tests | Pass | Fail |
|----------|-------|------|------|
| Auth & Session | 7 | 7 | 0 |
| Page-Level RBAC | 16 | 16 | 0 |
| Action-Level RBAC | 22 | 22 | 0 |
| API Route RBAC | 2 | 2 | 0 |
| Upload Security | 7 | 7 | 0 |
| Download Security | 6 | 6 | 0 |
| XSS Prevention | 5 | 5 | 0 |
| Data Integrity | 5 | 5 | 0 |
| Unauthorized Access | 8 | 8 | 0 |
| **Total** | **78** | **78** | **0** |

**Kết luận**: Tất cả security checks pass. 10 detail/edit/new pages đã được fix trong Phase 6 (thêm assertEngagementAccess). Upload route đã được fix để resolve engagement scope từ child entities.
