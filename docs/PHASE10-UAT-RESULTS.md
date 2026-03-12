# Phase 10 — UAT Rehearsal Results

**Date**: 2026-03-12
**Script**: `scripts/phase10-http-test.mjs`
**Method**: HTTP integration (dev server localhost:3000)
**Result**: **34/34 PASS — 0 FAIL**

---

## S0: Server Health (1 test)

| ID | Test | Result |
|----|------|--------|
| S0-01 | Server running (login page accessible) | PASS |

## S1: Dev Login — All Roles (6 tests)

| ID | Test | Result |
|----|------|--------|
| S1-01 | Chief Auditor login | PASS |
| S1-02 | Manager1 login | PASS |
| S1-03 | Manager2 login | PASS |
| S1-04 | Auditor1 login | PASS |
| S1-05 | Auditor2 login | PASS |
| S1-06 | Auditor3 login | PASS |

## C1: Chief Auditor UAT (12 tests)

| ID | Test | Result | Notes |
|----|------|--------|-------|
| C1-01 | Dashboard accessible | PASS | KPIs + stats visible |
| C1-02 | Engagements list accessible | PASS | All engagements shown |
| C1-03 | Fieldwork engagement visible | PASS | Full scope (no restriction) |
| C1-04 | Draft engagement visible | PASS | Full scope |
| C1-05 | Reporting engagement visible | PASS | Full scope |
| C1-06 | Global findings page | PASS | All findings across engagements |
| C1-07 | Global reports page | PASS | All reports across engagements |
| C1-08 | Documents page | PASS | All documents |
| C1-09 | Activity log accessible | PASS | Audit trail visible |
| C1-10 | Task detail (APPROVED) | PASS | Lock state visible |
| C1-11 | Finding detail | PASS | Risk + status visible |
| C1-12 | Report detail | PASS | Status visible |

## C2: Manager UAT (12 tests)

| ID | Test | Result | Notes |
|----|------|--------|-------|
| C2-01 | Dashboard accessible | PASS | Scoped KPIs |
| C2-02 | Engagements list accessible | PASS | Own engagements only |
| C2-03 | Own engagement visible (fieldwork) | PASS | Member |
| C2-04 | Own engagement visible (reporting) | PASS | Member |
| C2-05 | Non-member engagement blocked | PASS | demo-eng-draft → blocked |
| C2-06 | PENDING_REVIEW task accessible | PASS | Review queue |
| C2-07 | New engagement form accessible | PASS | Can create |
| C2-08 | Report detail accessible | PASS | Member of reporting eng |
| C2-09 | Finding detail accessible | PASS | Member of fieldwork eng |
| C2-10 | Activity log accessible | PASS | Audit trail |
| C2-11 | Documents page accessible | PASS | Scoped docs |
| C2-12 | Global findings accessible | PASS | Scoped findings |

## C3: Auditor UAT (10 tests)

| ID | Test | Result | Notes |
|----|------|--------|-------|
| C3-01 | Dashboard accessible | PASS | My tasks section |
| C3-02 | Engagements list accessible | PASS | Own engagements only |
| C3-03 | Own engagement visible | PASS | demo-eng-fieldwork |
| C3-04 | Non-member engagement blocked | PASS | demo-eng-draft → blocked |
| C3-05 | Own task accessible (IN_PROGRESS) | PASS | Can work on task |
| C3-06 | APPROVED task viewable | PASS | Read-only (locked) |
| C3-07 | Documents page accessible | PASS | Scoped docs |
| C3-08 | Global findings accessible | PASS | Scoped findings |
| C3-09 | Finding detail accessible | PASS | Member of engagement |
| C3-10 | Auditor3 blocked from fieldwork eng | PASS | Not member → blocked |

---

## SSO Limitation

Microsoft Entra ID SSO was **not tested** (DEV_AUTH=true, dev-credentials provider only). SSO E2E testing deferred to UAT Online with real Azure AD configuration.
