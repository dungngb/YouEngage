# BLUEPRINT – YouEngage

## 1. Tóm tắt dự án

YouEngage là hệ thống web nội bộ quản lý workflow kiểm toán nội bộ, triển khai on-premise.
Hệ thống giúp Ban Kiểm toán nội bộ quản lý tập trung từng cuộc kiểm toán (engagement) từ khâu planning, execution, signoff, reporting đến findings follow-up và lưu trữ hồ sơ.
Đây là hệ thống **attachment-driven audit workflow** — không phải document generation platform.
Quy mô: 10–20 users, ~10 engagements/năm, retention hồ sơ 10–20 năm.

---

## 2. Mục tiêu & KPI chính

### Mục tiêu chức năng:
- Quản lý engagement end-to-end (create → plan → execute → signoff → report → close).
- Signoff workflow có kiểm soát (preparer/reviewer, tuần tự, audit trail).
- Upload/attach tài liệu kiểm toán vào đúng bước trong workflow.
- Dashboard giám sát tiến độ cho lãnh đạo.
- Lưu trữ hồ sơ kiểm toán dài hạn, tra cứu được.

### Mục tiêu trải nghiệm:
- Giao diện đơn giản, dễ dùng cho người không giỏi công nghệ.
- Đăng nhập SSO một lần, không cần nhớ thêm mật khẩu.
- Tìm kiếm hồ sơ kiểm toán cũ nhanh chóng.

### Mục tiêu vận hành:
- Triển khai on-prem bằng Docker Compose, không phụ thuộc cloud.
- Không phát sinh license thương mại.
- Bảo trì đơn giản (backup DB + file storage).

---

## 3. Các Module chính

### Module 1 – Authentication & Access Control
- **Mục đích**: Xác thực người dùng qua Microsoft SSO, phân quyền theo role.
- **Ai dùng**: Tất cả người dùng.
- **Input**: Microsoft Entra ID token.
- **Output**: Session đã xác thực, role-based access.
- **Roles**: Trưởng ban, Manager, Auditor, System Admin.

### Module 2 – Engagement Management
- **Mục đích**: Tạo, quản lý, theo dõi trạng thái các cuộc kiểm toán.
- **Ai dùng**: Manager, Trưởng ban.
- **Input**: Thông tin engagement (tên, phạm vi, thời gian, team).
- **Output**: Engagement record có trạng thái lifecycle (Draft → Active → Fieldwork → Reporting → Closed).
- **Business rule**: Engagement không được đóng nếu còn hạng mục chưa hoàn tất signoff.

### Module 3 – Planning & Audit Setup
- **Mục đích**: Thiết lập kế hoạch kiểm toán cho từng engagement — tạo task, phân công, upload planning docs.
- **Ai dùng**: Manager.
- **Input**: Engagement đã tạo.
- **Output**: Danh sách task/workpaper với metadata, team assignment, planning documents đính kèm.

### Module 4 – Execution & Workpapers
- **Mục đích**: Auditor thực hiện công việc, cập nhật tiến độ, upload evidence/workpapers.
- **Ai dùng**: Auditor, Manager.
- **Input**: Task được phân công.
- **Output**: Task hoàn thành với evidence đính kèm, sẵn sàng cho signoff.
- **Lưu ý**: Hệ thống chỉ quản lý metadata + file đính kèm, không generate tài liệu.

### Module 5 – Signoff Workflow
- **Mục đích**: Quy trình ký duyệt hai bước (Preparer → Reviewer).
- **Ai dùng**: Auditor (preparer), Manager (reviewer).
- **Input**: Workpaper/task đã hoàn thành.
- **Output**: Signoff record có timestamp, người ký, trạng thái.
- **Business rules**:
  - Preparer ≠ Reviewer (bắt buộc).
  - Reviewer signoff chỉ sau khi Preparer đã signoff.
  - Reject → quay về Auditor kèm review comment.

### Module 6 – Reporting
- **Mục đích**: Quản lý báo cáo kiểm toán (draft → review → final/issued).
- **Ai dùng**: Manager, Trưởng ban.
- **Input**: Engagement đã qua execution.
- **Output**: Report record với trạng thái, file báo cáo đính kèm.
- **Business rule**: Final report phải có trạng thái khóa (locked) sau khi issued — không được sửa.

### Module 7 – Findings Follow-up
- **Mục đích**: Theo dõi các phát hiện kiểm toán, action plans, remediation status.
- **Ai dùng**: Auditor (tạo finding), Manager (theo dõi, validate).
- **Input**: Finding từ execution phase.
- **Output**: Finding record với trạng thái (Open → In Progress → Remediated → Closed), evidence remediation.
- **Business rule**: Finding chỉ được close sau khi có validation phù hợp.

### Module 8 – Document Repository, Dashboard & Audit Trail
- **Mục đích**: Lưu trữ tập trung hồ sơ kiểm toán, dashboard giám sát, audit trail mọi thao tác.
- **Ai dùng**: Tất cả (theo quyền).
- **Document Repository**:
  - Tổ chức file theo engagement / phase / task.
  - Tìm kiếm theo metadata (tên, ngày, engagement, loại tài liệu).
  - Retention 10–20 năm.
- **Dashboard**:
  - Trưởng ban: tổng quan engagements, findings open/overdue/closed, pending reviews.
  - Manager: tiến độ engagement đang quản lý, task status, signoff status.
- **Audit Trail**:
  - Log mọi thao tác quan trọng (signoff, status change, upload, delete).
  - Immutable, không xóa được.

---

## 4. Flow người dùng / quy trình chính

### Flow 1 – Đăng nhập
1. User truy cập URL hệ thống.
2. Redirect sang Microsoft SSO.
3. Xác thực thành công → redirect về dashboard theo role.

### Flow 2 – Tạo & quản lý Engagement
1. Manager tạo engagement mới (tên, phạm vi, thời gian, đơn vị kiểm toán).
2. Manager phân công team members.
3. Engagement chuyển trạng thái Draft → Active.
4. Manager theo dõi tiến độ trên engagement detail.

### Flow 3 – Planning
1. Manager tạo danh sách task/workpaper cho engagement.
2. Manager phân công task cho từng auditor.
3. Manager upload planning documents (audit program, risk matrix...) dưới dạng attachment.
4. Khi planning hoàn tất → chuyển sang execution.

### Flow 4 – Execution & Workpaper
1. Auditor xem task được phân công.
2. Auditor thực hiện công việc (offline, trên file có sẵn).
3. Auditor upload evidence / workpaper vào task tương ứng.
4. Auditor cập nhật trạng thái task.
5. Auditor thực hiện Preparer Signoff.

### Flow 5 – Signoff
1. Auditor (Preparer) signoff trên workpaper/task.
2. Manager (Reviewer) nhận notification có item pending review.
3. Manager review → Approve (Reviewer Signoff) hoặc Reject (kèm comment).
4. Nếu Reject → Auditor sửa và re-signoff.
5. Signoff hoàn tất → record locked.

### Flow 6 – Reporting
1. Manager tạo report record cho engagement.
2. Manager upload file draft report.
3. Report qua review → upload final version.
4. Report finalized/issued → trạng thái locked, không sửa được.

### Flow 7 – Findings Follow-up
1. Auditor tạo finding từ execution (mô tả, risk rating, recommendation).
2. Manager review finding.
3. Finding gửi cho auditee (ngoài hệ thống — email/offline).
4. Khi auditee remediate → Auditor upload evidence remediation.
5. Manager validate → Close finding.

### Flow 8 – Dashboard & tra cứu
1. Trưởng ban đăng nhập → thấy dashboard tổng thể.
2. Xem danh sách engagements, trạng thái, tiến độ.
3. Xem findings overview: open / overdue / closed.
4. Tra cứu hồ sơ kiểm toán cũ theo engagement, năm, đơn vị.

---

## 5. Dữ liệu & tích hợp

### Nguồn dữ liệu chính:
- PostgreSQL: tất cả metadata (engagements, tasks, signoffs, findings, audit trail).
- File storage (local/NAS): tài liệu đính kèm (Word, Excel, PDF).

### Bảng/entity quan trọng:
- `User` — thông tin user, role, SSO mapping.
- `Engagement` — cuộc kiểm toán, trạng thái lifecycle.
- `Task` / `Workpaper` — đơn vị công việc, metadata, trạng thái.
- `Signoff` — record ký duyệt (preparer/reviewer, timestamp, status).
- `Finding` — phát hiện kiểm toán, risk rating, status, remediation.
- `Report` — báo cáo kiểm toán, trạng thái, lock status.
- `Document` / `Attachment` — file metadata, storage path, liên kết engagement/task.
- `AuditLog` — immutable log mọi thao tác.

### Tích hợp:
- Microsoft Entra ID (OIDC) — xác thực SSO.
- File system / NAS — lưu trữ file đính kèm.
- (Tùy chọn) SMTP — notification email.

---

## 6. Đề xuất kiến trúc kỹ thuật

- **Frontend**: Next.js (App Router) + TypeScript + Tailwind CSS.
- **Backend**: Next.js API Routes (monolith, không microservices).
- **ORM**: Prisma.
- **Database**: PostgreSQL (primary). SQL Server chỉ nếu khách hàng bắt buộc.
- **Auth**: NextAuth.js / Auth.js với Microsoft Entra ID provider (OIDC).
- **File storage**: Local filesystem hoặc NAS mount, tách khỏi DB.
- **Deployment**: Docker Compose (on-prem).
- **Reverse proxy**: Nginx (optional, cho HTTPS termination).

---

## 7. Phase & Gates

### Phase 1 – Foundation & Core Workflow (MVP)

**Mục tiêu**: Hệ thống chạy được end-to-end cho 1 cuộc kiểm toán hoàn chỉnh.

**Modules phải có**: Tất cả 8 modules.

**Gates**:

| Gate | Tên | Tiêu chí |
|------|-----|----------|
| G1 | Project Setup & Auth | Cấu trúc dự án, DB schema, SSO login hoạt động, role-based access |
| G2 | Engagement & Planning | CRUD engagement, team assignment, task/workpaper management, file upload |
| G3 | Execution & Signoff | Task execution flow, preparer/reviewer signoff, reject/rework, audit trail |
| G4 | Reporting & Findings | Report management (draft→final→lock), findings CRUD, follow-up workflow |
| G5 | Dashboard & Polish | Dashboard cho Trưởng ban & Manager, document repository, search, UAT ready |

### Phase 2 – Enhancement (sau Phase 1)
- Notification nâng cao (email digest, in-app notification).
- Bulk operations.
- Advanced search & filtering.
- Data export / báo cáo thống kê.
- Performance optimization cho dữ liệu lớn.
