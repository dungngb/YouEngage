# CONTRACT – YouEngage Phase 1

## 1. Scope – Những gì sẽ làm trong Phase 1

### Tính năng / Module:

1. **Authentication & Access Control**
   - Microsoft SSO (Entra ID / OIDC).
   - 4 roles: Trưởng ban, Manager, Auditor, System Admin.
   - Role-based access control trên toàn bộ module.

2. **Engagement Management**
   - CRUD engagement (tên, phạm vi, thời gian, đơn vị kiểm toán).
   - Lifecycle management: Draft → Active → Fieldwork → Reporting → Closed.
   - Team assignment (phân công members vào engagement).
   - Engagement không được đóng nếu còn hạng mục chưa signoff.

3. **Planning & Audit Setup**
   - Tạo danh sách task/workpaper cho engagement.
   - Phân công task cho auditor.
   - Upload planning documents (attachment).

4. **Execution & Workpapers**
   - Auditor cập nhật task status.
   - Upload evidence / workpaper (attachment-driven).
   - Task metadata management (không generate tài liệu).

5. **Signoff Workflow**
   - Preparer signoff (auditor).
   - Reviewer signoff (manager).
   - Preparer ≠ Reviewer (enforced).
   - Reviewer chỉ signoff sau Preparer.
   - Reject + review comment → rework loop.
   - Signoff record: timestamp, người ký, trạng thái.

6. **Reporting**
   - Report record management (Draft → Review → Final → Issued).
   - Upload file báo cáo (attachment).
   - Final report locked sau khi issued.

7. **Findings Follow-up**
   - CRUD finding (mô tả, risk rating, recommendation).
   - Finding lifecycle: Open → In Progress → Remediated → Closed.
   - Upload remediation evidence.
   - Finding chỉ close sau validation.

8. **Document Repository, Dashboard & Audit Trail**
   - Lưu trữ file theo cấu trúc engagement/phase/task.
   - Tìm kiếm file theo metadata.
   - Dashboard tổng thể cho Trưởng ban.
   - Dashboard engagement cho Manager.
   - Audit trail immutable cho mọi thao tác quan trọng.

### Tài liệu cần tạo:
- INTAKE.md, BLUEPRINT.md, CONTRACT.md, GATES.md.
- Job brief cho từng gate.
- DB schema (Prisma).
- API route documentation.

---

## 2. Out-of-scope – KHÔNG làm trong Phase 1

- Annual audit plan / audit universe / risk assessment đầu năm.
- Auditee portal / external login.
- Multi-level reviewer chain (chỉ 1 preparer + 1 reviewer).
- Template management engine / template versioning.
- Document template builder / auto-generate workpapers.
- Dynamic form builder.
- Mobile app.
- AI features (auto-summarize, risk scoring...).
- BI nâng cao (pivot tables, custom charts...).
- Email notification system (Phase 2).
- Bulk import hồ sơ cũ (Phase 2).
- Multi-language support.
- Real-time collaboration / concurrent editing.

> Nếu có yêu cầu mới nảy sinh giữa Phase 1 → ghi vào backlog, KHÔNG tự ý nhồi vào scope.

---

## 3. Definition of Done (DoD)

Phase 1 chỉ được coi là "xong" khi:

- [ ] User đăng nhập được bằng Microsoft SSO.
- [ ] Phân quyền theo 4 roles hoạt động đúng.
- [ ] Tạo và quản lý engagement end-to-end (Draft → Closed).
- [ ] Tạo task/workpaper, phân công auditor, upload attachment.
- [ ] Signoff workflow hoạt động đúng business rules (preparer ≠ reviewer, tuần tự).
- [ ] Report management với trạng thái lock khi finalized.
- [ ] Findings CRUD với lifecycle và validation khi close.
- [ ] Dashboard hiển thị tiến độ engagements, findings summary.
- [ ] Document repository lưu trữ và tìm kiếm file.
- [ ] Audit trail ghi log mọi thao tác quan trọng.
- [ ] Deploy được trên Docker Compose (on-prem).
- [ ] Chạy được 1 engagement hoàn chỉnh từ đầu đến cuối (UAT scenario).

---

## 4. Yêu cầu chất lượng

### UX/UI:
- Giao diện clean, responsive (desktop-first, hỗ trợ tablet).
- Navigation rõ ràng theo engagement → task → signoff.
- Trạng thái (status) luôn hiển thị rõ ràng bằng badge/color.
- Form validation phía client + server.

### Hiệu năng:
- Page load < 3 giây trên mạng nội bộ.
- File upload hỗ trợ tối thiểu 50MB/file.
- Dashboard render trong < 5 giây với 10 engagements, 200 tasks.

### Code:
- TypeScript strict mode.
- Prisma schema rõ ràng, có migration.
- API routes có error handling, input validation.
- Không hardcode secrets — dùng environment variables.
- Code structure theo convention Next.js App Router.

### Tài liệu & onboarding:
- README hướng dẫn setup dev environment.
- Docker Compose file chạy được ngay.
- Hướng dẫn cấu hình SSO (Entra ID app registration).

---

## 5. GATES & tiêu chí

### Gate 1 – Project Setup & Auth
**Tiêu chí qua:**
- Next.js project khởi tạo với TypeScript + Tailwind.
- Prisma schema cho User, Role.
- PostgreSQL chạy trong Docker.
- Microsoft SSO login/logout hoạt động.
- Role-based middleware bảo vệ routes.
- Seed data cho roles.

### Gate 2 – Engagement & Planning
**Tiêu chí qua:**
- CRUD engagement hoạt động.
- Engagement lifecycle (trạng thái chuyển đổi đúng).
- Team assignment hoạt động.
- Task/workpaper CRUD.
- File upload/download hoạt động.
- Phân công task cho auditor.

### Gate 3 – Execution & Signoff
**Tiêu chí qua:**
- Auditor cập nhật task, upload evidence.
- Preparer signoff hoạt động.
- Reviewer signoff hoạt động (chỉ sau preparer).
- Preparer ≠ Reviewer enforced.
- Reject + rework loop hoạt động.
- Audit trail ghi log signoff events.

### Gate 4 – Reporting & Findings
**Tiêu chí qua:**
- Report CRUD với lifecycle (Draft → Final → Locked).
- Final report locked — không sửa/xóa được.
- Finding CRUD với lifecycle.
- Finding close chỉ sau validation.
- Remediation evidence upload.

### Gate 5 – Dashboard & Polish
**Tiêu chí qua:**
- Dashboard Trưởng ban: engagement overview, findings summary, pending reviews.
- Dashboard Manager: engagement detail, task progress, signoff status.
- Document repository với search.
- UAT scenario chạy được end-to-end.
- Docker Compose deploy hoạt động.

---

## 6. Quy tắc thay đổi

- Nếu cần đổi scope:
  - Cập nhật lại CONTRACT.md và đánh dấu version (v1.1, v1.2...).
  - Ghi rõ lý do thay đổi.
  - Được Chủ đầu tư chấp thuận trước khi thực hiện.

- Nếu cần đổi kiến trúc:
  - Cập nhật BLUEPRINT.md và ghi lý do.
  - Đánh giá impact lên các Gate đã qua.

- Nếu phát sinh scope mới:
  - Ghi vào backlog (file riêng hoặc section trong GATES.md).
  - Không tự ý thêm vào Phase 1.
