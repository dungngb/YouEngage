# YouEngage

**Internal Audit Workflow Management System**

---

## Mục tiêu sản phẩm

YouEngage là phần mềm web nội bộ giúp Ban Kiểm toán nội bộ quản lý tập trung workflow của từng cuộc kiểm toán (engagement), bao gồm: audit planning, execution, reporting, findings follow-up, signoff workflow, và lưu trữ hồ sơ kiểm toán.

Hệ thống là **attachment-driven audit workflow** — không phải document generation platform. Khách hàng tiếp tục sử dụng file biểu mẫu/tài liệu có sẵn của họ, hệ thống quản lý metadata, trạng thái, signoff và lưu trữ.

## Phạm vi phiên bản đầu tiên (Phase 1)

| # | Module | Mô tả |
|---|--------|--------|
| 1 | Authentication & Access Control | Microsoft SSO, 4 roles |
| 2 | Engagement Management | CRUD engagement, lifecycle, team assignment |
| 3 | Planning & Audit Setup | Task/workpaper creation, assignment, planning docs |
| 4 | Execution & Workpapers | Task execution, evidence upload, status tracking |
| 5 | Signoff Workflow | Preparer/Reviewer signoff, reject/rework |
| 6 | Reporting | Report lifecycle, final report locking |
| 7 | Findings Follow-up | Finding lifecycle, remediation, validation |
| 8 | Document Repository, Dashboard & Audit Trail | File storage, dashboards, immutable logs |

## Stack kỹ thuật

- **Frontend**: Next.js 14 (App Router) + TypeScript + Tailwind CSS 3
- **Backend**: Next.js API Routes (monolith)
- **ORM**: Prisma 5
- **Database**: PostgreSQL 16
- **Auth**: Microsoft Entra ID (OIDC) via NextAuth.js v5
- **Deployment**: Docker Compose (on-prem)
- **File storage**: Local filesystem / NAS

## Gates – Phase 1

| Gate | Tên | Trạng thái |
|------|-----|------------|
| G1 | Project Setup & Auth | DONE |
| G2 | Engagement & Planning | DONE |
| G3 | Execution & Signoff | DONE |
| G4 | Reporting & Findings | DONE |
| G5 | Dashboard & Polish | DONE |

## Tình trạng hiện tại

| Phase | Tên | Trạng thái |
|-------|-----|------------|
| Phase 1 | Core Modules (5 gates) | DONE |
| Phase 2 | Execution + Signoff Control Core | DONE |
| Phase 3 | Scope Hardening + Workflow Closure | DONE |
| Phase 4 | UAT Polish + Operational Hardening | DONE |
| **Phase 5** | **Pilot Readiness + Security Hardening** | **DONE** |

**Pilot-ready** — Hệ thống đã qua security hardening và có đầy đủ tài liệu pilot.

---

## Quick Start (Development)

### Yêu cầu

- Node.js 20+
- Docker & Docker Compose
- Microsoft Entra ID app registration (cho SSO)

### Các bước

```bash
# 1. Clone repo
cd YouEngage

# 2. Start PostgreSQL
docker compose up db -d

# 3. Install dependencies
npm install

# 4. Copy env file and configure
cp .env.example .env.local
# → Sửa .env.local: điền AUTH_SECRET, SSO credentials

# 5. Run DB migration & seed
npx prisma migrate dev
npm run db:seed

# 6. Start dev server
npm run dev
# → http://localhost:3000
```

### Tạo AUTH_SECRET

```bash
openssl rand -base64 32
```

---

## Deployment (Docker Compose — Production)

### 1. Chuẩn bị server

- Linux server (Ubuntu 22.04+ recommended)
- Docker Engine 24+ & Docker Compose v2
- Port 3000 (hoặc port tùy chọn) mở cho nội bộ

### 2. Cấu hình Microsoft Entra ID

1. Đăng nhập Azure Portal → Microsoft Entra ID → App registrations → **New registration**
2. Name: `YouEngage`
3. Supported account types: **Single tenant**
4. Redirect URI: `https://your-domain:3000/api/auth/callback/microsoft-entra-id`
5. Vào **Certificates & secrets** → New client secret → copy value
6. Ghi lại:
   - **Application (client) ID** → `AUTH_MICROSOFT_ENTRA_ID_ID`
   - **Client secret value** → `AUTH_MICROSOFT_ENTRA_ID_SECRET`
   - **Directory (tenant) ID** → `AUTH_MICROSOFT_ENTRA_ID_TENANT_ID`

### 3. Tạo file `.env`

```bash
cp .env.example .env
```

Sửa file `.env`:

```env
DB_PASSWORD=your-strong-db-password
AUTH_SECRET=your-auth-secret-generated-by-openssl
AUTH_URL=https://your-domain:3000
AUTH_MICROSOFT_ENTRA_ID_ID=your-azure-client-id
AUTH_MICROSOFT_ENTRA_ID_SECRET=your-azure-client-secret
AUTH_MICROSOFT_ENTRA_ID_TENANT_ID=your-azure-tenant-id
```

### 4. Build & Deploy

```bash
# Build và start tất cả services
docker compose up -d --build

# Kiểm tra logs
docker compose logs -f app

# Seed roles (lần đầu)
docker compose exec app npx prisma db seed
```

### 5. Thư mục uploads

Hệ thống lưu file vào thư mục `./uploads` (mặc định). Để dùng thư mục khác, sửa `UPLOAD_DIR` trong `.env`.

**Loại file cho phép**: PDF, Word, Excel, PowerPoint, images (png/jpg/gif), text/csv, zip/rar. Giới hạn: 50MB/file.

**Bảo mật file upload** (Phase 5):
- Extension allowlist + MIME type cross-validation
- Filename sanitization (strip path traversal, control chars)
- Double-extension detection (e.g., `file.pdf.exe` bị từ chối)
- Download: `X-Content-Type-Options: nosniff`, `Content-Security-Policy: default-src 'none'`
- Path traversal prevention trên cả upload và download routes

```bash
# Tạo thư mục uploads (nếu chưa có)
mkdir -p uploads

# Đảm bảo quyền ghi (Linux)
chmod 775 uploads
```

### 6. Truy cập

Mở browser → `http://your-server:3000` → Đăng nhập bằng Microsoft SSO.

### 6. Backup & Restore

#### Backup database

```bash
# Backup PostgreSQL
docker compose exec db pg_dump -U youengage youengage > backup_$(date +%Y%m%d_%H%M%S).sql
```

#### Backup file uploads

```bash
# Copy uploads volume
docker compose cp app:/app/uploads ./uploads_backup_$(date +%Y%m%d)
```

#### Restore database

```bash
# Restore từ file backup
cat backup_file.sql | docker compose exec -T db psql -U youengage youengage
```

### 7. Cập nhật phiên bản

```bash
# Pull code mới
git pull

# Rebuild và restart
docker compose up -d --build

# Chạy migration (nếu có schema changes)
docker compose exec app npx prisma migrate deploy
```

---

## Cấu trúc thư mục

```
YouEngage/
├── docs/
│   ├── INTAKE.md              # Mô tả ban đầu dự án
│   ├── BLUEPRINT.md           # Kiến trúc tổng thể
│   ├── CONTRACT.md            # Phạm vi & tiêu chuẩn Phase 1
│   ├── GATES.md               # Theo dõi tiến độ theo Gate
│   ├── PILOT-CHECKLIST.md     # Checklist pilot readiness
│   ├── DEMO-SCRIPT.md         # Kịch bản demo theo vai trò
│   ├── DEPLOYMENT-CHECKLIST.md # Hướng dẫn triển khai chi tiết
│   ├── KNOWN-LIMITATIONS.md   # Giới hạn đã biết & roadmap
│   └── HANDOFF-PHASE*.md      # Handoff reports per phase
├── src/
│   ├── app/               # App Router (pages, API routes)
│   │   ├── dashboard/     # Dashboard, engagements, findings, reports, documents
│   │   ├── api/           # Upload, file download, auth endpoints
│   │   └── login/         # Login page
│   ├── components/ui/     # Shared UI components
│   ├── lib/               # Auth, Prisma, server actions, constants
│   │   └── actions/       # Server actions (engagement, task, signoff, report, finding)
│   └── middleware.ts      # Route protection
├── prisma/
│   ├── schema.prisma      # Database schema
│   └── seed.ts            # Seed data (roles)
├── jobs/                  # Job briefs per gate
├── docker-compose.yml     # Production deployment
├── Dockerfile             # Multi-stage build
└── README.md
```

## UAT Scenario — End-to-end workflow

### Dữ liệu demo (seed)

Chạy `npm run db:seed` để tạo dữ liệu mẫu gồm:
- **6 users**: 1 chief auditor, 2 managers, 3 auditors
- **3 engagements**: Fieldwork (3 tasks, 2 findings), Draft, Reporting (2 tasks, 1 report, 1 finding)
- Signoffs, audit logs mẫu

### Kịch bản chính (happy path)

1. **Đăng nhập** — User đăng nhập bằng Microsoft SSO → redirect về Dashboard
2. **Tạo Engagement** — Manager tạo engagement mới (tên, phạm vi, thời gian)
3. **Phân công Team** — Manager thêm auditor vào engagement
4. **Chuyển ACTIVE** — Manager chuyển engagement sang trạng thái Active
5. **Tạo Tasks** — Manager tạo tasks/workpapers, phân công cho auditor
6. **Chuyển FIELDWORK** — Manager chuyển engagement sang Fieldwork
7. **Thực hiện Task** — Auditor cập nhật status → IN_PROGRESS, upload evidence
8. **Preparer Signoff** — Auditor hoàn thành task → COMPLETED, thực hiện preparer signoff
9. **Reviewer Signoff** — Manager review → Approve hoặc Reject (nếu reject → auditor rework → re-signoff)
10. **Chuyển REPORTING** — Manager chuyển engagement sang Reporting
11. **Tạo Report** — Manager tạo report, upload file báo cáo
12. **Report Lifecycle** — Manager chuyển report: DRAFT → REVIEW → FINAL → ISSUED (locked)
13. **Tạo Finding** — Auditor tạo finding (mô tả, risk rating, khuyến nghị)
14. **Finding Lifecycle** — Finding: OPEN → IN_PROGRESS → upload remediation evidence → REMEDIATED
15. **Close Finding** — Manager validate → Close finding (yêu cầu: có evidence + role manager+)
16. **Dashboard** — Trưởng ban kiểm tra dashboard: engagement overview, findings summary, pending reviews
17. **Kho tài liệu** — Tìm kiếm tài liệu theo tên file, engagement, loại
18. **Đóng Engagement** — Manager chuyển engagement sang CLOSED (tất cả tasks phải APPROVED)

### Kịch bản lỗi / edge cases

- **Upload file .exe** → Bị từ chối với thông báo rõ ràng (toast)
- **Upload file double-extension** (e.g., `report.pdf.exe`) → Bị từ chối
- **Upload file MIME mismatch** (e.g., file .pdf nhưng content-type khác) → Bị từ chối
- **Upload file > 50MB** → Bị từ chối client-side và server-side
- **Đóng engagement khi còn task chưa duyệt** → Toast error kèm số task chưa duyệt
- **Preparer = Reviewer** → Lỗi "phải là hai người khác nhau"
- **Upload vào task đã APPROVED** → Bị từ chối
- **Sửa báo cáo đã ISSUED** → Không hiển thị nút sửa
- **Truy cập URL không tồn tại** → Hiển thị trang 404 styled
- **Lỗi server** → Hiển thị error boundary với nút "Thử lại"

### Kịch bản theo vai trò

- **Chief Auditor**: Xem tất cả engagements, dashboard tổng thể, open findings
- **Manager**: Quản lý engagement, phân công, review signoff, tạo báo cáo, close findings
- **Auditor**: Thực hiện task, preparer signoff, tạo findings, upload evidence

## Tài liệu tham chiếu

- Quy trình Vibecode Kit: Intake → Blueprint → Contract → Build → Refine
- Business rules: xem `docs/CONTRACT.md` mục 1
- Kiến trúc chi tiết: xem `docs/BLUEPRINT.md`

## Tài liệu Pilot

- **Pilot checklist**: `docs/PILOT-CHECKLIST.md` — Checklist đầy đủ trước khi go-live
- **Demo script**: `docs/DEMO-SCRIPT.md` — Kịch bản demo 30–45 phút, theo vai trò
- **Deployment guide**: `docs/DEPLOYMENT-CHECKLIST.md` — Hướng dẫn triển khai step-by-step
- **Known limitations**: `docs/KNOWN-LIMITATIONS.md` — Giới hạn, workaround, roadmap khả thi
