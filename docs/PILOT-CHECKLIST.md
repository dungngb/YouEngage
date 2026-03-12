# Pilot Readiness Checklist

**Dự án**: YouEngage — Internal Audit Workflow Management
**Phiên bản**: Phase 5 (Pilot Readiness)
**Ngày cập nhật**: 2026-03-04

---

## 1. Hạ tầng & Triển khai

- [ ] Server Linux (Ubuntu 22.04+) đã cài Docker Engine 24+ & Docker Compose v2
- [ ] Port 3000 (hoặc APP_PORT tùy chọn) mở cho mạng nội bộ
- [ ] File `.env` đã cấu hình đầy đủ (xem `.env.example`)
- [ ] Thư mục uploads đã tạo và có quyền ghi (`chmod 775 uploads`)
- [ ] `docker compose up -d --build` chạy thành công
- [ ] `docker compose exec app npx prisma migrate deploy` hoàn tất
- [ ] `docker compose exec app npx prisma db seed` đã chạy (dữ liệu demo)
- [ ] Truy cập `http://server:3000` hiện trang login

## 2. Microsoft Entra ID (SSO)

- [ ] App registration đã tạo trên Azure Portal
- [ ] Redirect URI đúng: `https://domain:port/api/auth/callback/microsoft-entra-id`
- [ ] Client ID, Client Secret, Tenant ID đã điền vào `.env`
- [ ] Đăng nhập SSO thành công → redirect về Dashboard
- [ ] User mới tự động được gán role `auditor`

## 3. Phân quyền & Vai trò

- [ ] Admin có thể thay đổi role user qua Prisma Studio hoặc SQL
- [ ] Chief Auditor xem được tất cả engagements
- [ ] Manager chỉ xem engagement mình là thành viên
- [ ] Auditor chỉ xem engagement mình được phân công
- [ ] URL trực tiếp tới engagement không phải thành viên → 404/403

## 4. Workflow Cốt lõi

- [ ] Tạo engagement mới (Manager+)
- [ ] Phân công thành viên vào engagement
- [ ] Tạo task, phân công auditor
- [ ] Chuyển engagement: DRAFT → ACTIVE → FIELDWORK → REPORTING → CLOSED
- [ ] Auditor cập nhật task: TODO → IN_PROGRESS → COMPLETED
- [ ] Preparer signoff → Pending Review
- [ ] Reviewer signoff → Approved (người khác với preparer)
- [ ] Reject → auditor rework → re-signoff
- [ ] Tạo report, chuyển DRAFT → REVIEW → FINAL → ISSUED (locked)
- [ ] Tạo finding, lifecycle: OPEN → IN_PROGRESS → REMEDIATED
- [ ] Close finding (manager+, cần evidence, status REMEDIATED)
- [ ] Đóng engagement (tất cả tasks phải APPROVED)

## 5. File Upload & Download

- [ ] Upload file PDF/Word/Excel/PPT/Image thành công
- [ ] Upload file `.exe` → bị từ chối (toast error)
- [ ] Upload file > 50MB → bị từ chối
- [ ] Upload file double-extension (e.g., `report.pdf.exe`) → bị từ chối
- [ ] Download file đúng tên gốc
- [ ] Không thể upload vào task APPROVED / report ISSUED / finding CLOSED
- [ ] Xóa file thành công (trừ khi locked)

## 6. Dashboard & Báo cáo

- [ ] Dashboard hiển thị dữ liệu đúng theo role
- [ ] Kho tài liệu: tìm kiếm và lọc hoạt động
- [ ] Notification badges trên sidebar (pending reviews, open findings)
- [ ] Activity log per engagement hiển thị đúng

## 7. Xử lý Lỗi & UX

- [ ] Toast notifications trên tất cả actions (success + error)
- [ ] Trang 404 styled khi truy cập URL không tồn tại
- [ ] Error boundary hiển thị khi server error
- [ ] Loading skeleton khi dashboard đang tải
- [ ] Form validation: required fields, error toast

## 8. Backup & Vận hành

- [ ] Backup database: `docker compose exec db pg_dump ...` thành công
- [ ] Backup uploads: `docker compose cp app:/app/uploads ...`
- [ ] Log rotation hoạt động (kiểm tra `docker compose logs`)
- [ ] Quy trình cập nhật phiên bản đã document (git pull + rebuild)

---

## Kết quả Pilot

| Hạng mục | Pass/Fail | Ghi chú |
|----------|-----------|---------|
| Hạ tầng | | |
| SSO | | |
| Phân quyền | | |
| Workflow | | |
| File handling | | |
| Dashboard | | |
| UX/Error handling | | |
| Backup | | |

**Ngày pilot**: _______________
**Người kiểm tra**: _______________
**Kết luận**: [ ] PASS — sẵn sàng go-live / [ ] FAIL — cần fix (xem ghi chú)
