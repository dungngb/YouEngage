# Phase 10 — Pre-UAT End-to-End Test Plan

## Test Environment
- **Runtime**: Next.js 14 dev server (localhost:3000)
- **Database**: Neon PostgreSQL (cloud)
- **Auth**: DEV_AUTH=true (dev-credentials provider)
- **Seed data**: 6 users, 3 engagements, tasks/findings/reports per prisma/seed.ts
- **SSO limitation**: Microsoft Entra ID not tested (dev auth only); SSO E2E deferred to UAT Online

## Test Scripts
- `scripts/phase10-e2e-test.mjs` — DB-level business flow validation (Prisma direct)
- `scripts/phase10-http-test.mjs` — HTTP integration + UAT + security tests

---

## B. E2E Business Flow Tests

### B1: Engagement Lifecycle (10 tests)
| ID | Test | Method |
|----|------|--------|
| B1-01 | Create engagement (manager) | DB |
| B1-02 | Add member (auditor) | DB |
| B1-03 | Remove member | DB |
| B1-04 | DRAFT → ACTIVE transition | DB |
| B1-05 | Planning gate: ACTIVE → FIELDWORK fails without task | DB |
| B1-06 | Planning gate: ACTIVE → FIELDWORK fails without auditor | DB |
| B1-07 | Planning gate: passes with all conditions | DB |
| B1-08 | FIELDWORK → REPORTING | DB |
| B1-09 | Close gate: REPORTING → CLOSED fails without all tasks APPROVED | DB |
| B1-10 | Close gate: passes when all tasks APPROVED | DB |

### B2: Task/Signoff Flow (14 tests)
| ID | Test | Method |
|----|------|--------|
| B2-01 | Create task (TODO) | DB |
| B2-02 | TODO → IN_PROGRESS → COMPLETED | DB |
| B2-03 | Preparer signoff → PENDING_REVIEW | DB |
| B2-04 | Reviewer approve → APPROVED (task locked) | DB |
| B2-05 | Locked task: updateTask blocked | DB |
| B2-06 | Locked task: updateTaskStatus blocked | DB |
| B2-07 | Locked task: deleteTask blocked | DB |
| B2-08 | Reviewer reject (comment required) → REJECTED | DB |
| B2-09 | Rework: REJECTED → COMPLETED → preparer signoff | DB |
| B2-10 | Rework: reviewer approve → APPROVED | DB |
| B2-11 | Reopen: manager reopen with reason | DB |
| B2-12 | Reopen: signoff invalidation + audit log | DB |
| B2-13 | Preparer ≠ Reviewer enforced | DB |
| B2-14 | PENDING_REVIEW lock: upload blocked | DB |

### B3: Report Lifecycle (7 tests)
| ID | Test | Method |
|----|------|--------|
| B3-01 | Create report DRAFT | DB |
| B3-02 | DRAFT → REVIEW → FINAL | DB |
| B3-03 | Issuance gate: FINAL → ISSUED fails if not REPORTING | DB |
| B3-04 | Issuance gate: FINAL → ISSUED fails if tasks not all APPROVED | DB |
| B3-05 | Issuance gate: passes when conditions met | DB |
| B3-06 | ISSUED report: update blocked | DB |
| B3-07 | ISSUED report: delete blocked | DB |

### B4: Finding Lifecycle (6 tests)
| ID | Test | Method |
|----|------|--------|
| B4-01 | Create finding OPEN | DB |
| B4-02 | OPEN → IN_PROGRESS → REMEDIATED | DB |
| B4-03 | Close validation: fails without attachment | DB |
| B4-04 | Close validation: fails without manager role | DB |
| B4-05 | Close validation: passes with attachment + manager | DB |
| B4-06 | CLOSED finding: update/delete blocked | DB |

### B5: Document Flow (8 tests)
| ID | Test | Method |
|----|------|--------|
| B5-01 | Upload valid file | HTTP |
| B5-02 | Download file (scope + headers) | HTTP |
| B5-03 | Delete file (audit log) | HTTP |
| B5-04 | MIME mismatch rejected | HTTP |
| B5-05 | Double extension rejected | HTTP |
| B5-06 | Oversized upload rejected | HTTP |
| B5-07 | Unauthorized download blocked | HTTP |
| B5-08 | Upload to locked entity blocked | HTTP |

---

## C. UAT Rehearsal

### C1: Chief Auditor (12 tests)
Dashboard KPIs, full scope visibility, activity log, audit trail

### C2: Manager (12 tests)
Engagement management, review queue, signoff, reopen, gates

### C3: Auditor (10 tests)
My tasks, upload evidence, preparer signoff, rework, scope restrictions

---

## D. Security Tests

### D1: Authorization/RBAC/Scope (8 tests)
Scoped queries, direct URL block, unauthorized actions, file scope

### D2: Upload/Download Hardening (6 tests)
MIME validation, filename sanitize, double ext, path traversal, response headers

### D3: Session/Auth (4 tests)
Expired session, logout, unauth API access

---

## Total: ~97 test cases
- B: 45 (business flows)
- C: 34 (UAT rehearsal)
- D: 18 (security)
