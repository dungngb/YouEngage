# Phase 6 — Performance Results

**Dự án**: YouEngage
**Phương pháp**: Code review + structure analysis (không có load testing)
**Ngày**: 2026-03-04

---

## 1. Giới hạn

Không có load testing framework (Jest/Vitest/k6/Artillery chưa setup). Performance review chỉ dựa trên:
- Phân tích query structure (N+1, parallel queries, index usage)
- Prisma schema review (indexes, relations)
- Response size estimation
- Frontend bundle size (from build output)

---

## 2. Query Performance Analysis

### 2.1 Dashboard Page

| Query | Pattern | Assessment |
|-------|---------|-----------|
| Engagements | `findMany` with scope filter | OK — scoped, ordered by updatedAt |
| Tasks | `findMany` with scope filter + includes | OK — scoped, includes engagement name |
| Findings | `findMany` with scope filter + includes | OK — scoped, includes engagement name |
| Reports | `findMany` with scope filter | OK — lightweight, select id + status only |
| **Parallel** | All 4 queries run via `Promise.all()` | GOOD — maximum parallelism |

**Assessment**: Good. No N+1 issues. All queries scoped and parallel.

### 2.2 List Pages

| Page | Limit | Index | Assessment |
|------|-------|-------|-----------|
| Engagements | No limit (scoped) | id (PK), members FK | OK for pilot scale |
| Findings | No limit (scoped) | engagementId FK | OK for pilot scale |
| Reports | No limit (scoped) | engagementId FK | OK for pilot scale |
| Documents | `take: 100` | engagementId FK | OK — has limit |

**Risk**: Without pagination, large datasets (1000+ items) may slow down. Acceptable for pilot (expect < 100 engagements).

### 2.3 Detail Pages

| Page | Queries | Assessment |
|------|---------|-----------|
| Engagement detail | 1 query with includes (members, tasks, reports, findings, attachments) | Medium — could be heavy with many children |
| Task detail | 1 query with includes (engagement, assignee, attachments, signoffs) | OK — bounded scope |
| Finding detail | 1 query with includes (engagement, attachments, createdBy, closedBy) | OK |
| Report detail | 1 query with includes (engagement, attachments, createdBy) | OK |

### 2.4 Activity Log

| Pattern | Assessment |
|---------|-----------|
| 3 parallel queries (tasks, reports, findings) to get child IDs | OK |
| 1 query for audit logs with `IN` clause + `take: 200` | OK — has limit |

---

## 3. Frontend Bundle Size

From `npx next build` output:

| Route | Size | First Load JS | Assessment |
|-------|------|---------------|-----------|
| Dashboard | 192 B | 96.2 kB | OK |
| Engagement detail | 18.5 kB | 124 kB | Largest — has many components |
| Task detail | 3.17 kB | 108 kB | OK |
| Finding detail | 2.33 kB | 108 kB | OK |
| Report detail | 2.31 kB | 108 kB | OK |
| Form pages | ~557 B | ~106 kB | OK |
| **Shared JS** | - | **87.3 kB** | OK for enterprise app |

**Assessment**: Bundle sizes are reasonable. No oversized pages.

---

## 4. File Upload/Download

| Aspect | Implementation | Assessment |
|--------|---------------|-----------|
| Upload | `arrayBuffer()` → `Buffer.from()` → `writeFile()` | OK for files ≤ 50MB |
| Download | `readFile()` → Response buffer | OK — loads entire file into memory |
| Size limit | 50MB server + client | Appropriate for document-based workflow |

**Risk**: Files are fully buffered in memory. For very large files (approaching 50MB), Node.js memory usage will spike. Acceptable for pilot.

---

## 5. Database Schema / Index Analysis

| Model | Indexes | Assessment |
|-------|---------|-----------|
| User | `email` (unique) | OK |
| Engagement | `id` (PK) | OK — queries by ID or full scan with scope |
| EngagementMember | `@@unique([engagementId, userId])` | GOOD — composite unique index |
| Task | `engagementId` (FK) | OK — queries always filter by engagement |
| Signoff | `taskId` (FK) | OK |
| Attachment | `engagementId`, `taskId`, `reportId`, `findingId` (FKs) | OK — FK indexes |
| AuditLog | `entityId` (no explicit index) | MEDIUM — could benefit from index at scale |
| Finding | `engagementId` (FK) | OK |
| Report | `engagementId` (FK) | OK |

**Recommendation**: Consider adding index on `AuditLog.entityId` nếu activity log chậm ở scale lớn.

---

## 6. Concurrent Usage Estimate

| Users | Expected Impact | Notes |
|-------|----------------|-------|
| 5 | No impact | Single Node.js process handles easily |
| 10 | No impact | Standard Next.js workload |
| 20 | Minimal | May see slight delay on concurrent uploads |
| 50+ | Needs monitoring | Consider PM2 cluster mode hoặc horizontal scaling |

**Giới hạn**: Không test thực tế. Estimate dựa trên experience với Next.js + PostgreSQL.

---

## 7. Summary

| Area | Status | Risk for Pilot |
|------|--------|---------------|
| Dashboard load | Good | Low |
| List pages | Good | Low (no pagination — risk at scale) |
| Detail pages | Good | Low |
| File upload/download | Good | Low (50MB buffer — acceptable) |
| Bundle size | Good | Low |
| Database queries | Good | Low (consider AuditLog index at scale) |
| Concurrent users (5-20) | Estimated OK | Low |

**Kết luận**: Performance chấp nhận được cho pilot (dự kiến < 20 concurrent users, < 100 engagements). Không có bottleneck rõ ràng. Recommendations cho production scale: pagination, AuditLog index, PM2 cluster mode.
