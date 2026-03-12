# Demo Script — Kịch bản trình diễn theo vai trò

**Dự án**: YouEngage — Internal Audit Workflow Management
**Thời lượng dự kiến**: 30–45 phút
**Yêu cầu**: Đã chạy `npm run db:seed` để có dữ liệu demo

---

## Dữ liệu demo có sẵn

| User | Role | Email (seed) |
|------|------|------|
| Nguyễn Văn An | chief_auditor | an.nguyen@example.com |
| Trần Thị Bình | manager | binh.tran@example.com |
| Lê Minh Cường | manager | cuong.le@example.com |
| Phạm Thị Dung | auditor | dung.pham@example.com |
| Hoàng Văn Em | auditor | em.hoang@example.com |
| Vũ Thị Phương | auditor | phuong.vu@example.com |

| Engagement | Status | Tasks | Findings | Reports |
|------------|--------|-------|----------|---------|
| Kiểm toán CNTT Q1-2026 | FIELDWORK | 3 | 2 | 0 |
| Kiểm toán Tài chính Q4-2025 | DRAFT | 0 | 0 | 0 |
| Kiểm toán Tuân thủ 2025 | REPORTING | 2 | 1 | 1 |

---

## Kịch bản 1: Chief Auditor — Tổng quan & Giám sát

**Mục tiêu**: Thể hiện khả năng giám sát toàn diện

1. **Đăng nhập** bằng tài khoản Chief Auditor
2. **Dashboard**: Xem tổng quan
   - Số engagement theo trạng thái
   - Open findings (sắp xếp theo risk: HIGH → MEDIUM → LOW)
   - Pending reviews
3. **Engagements**: Xem danh sách tất cả engagements (không bị giới hạn scope)
4. **Findings**: Vào `/dashboard/findings` — xem tất cả findings across engagements
5. **Reports**: Vào `/dashboard/reports` — xem tất cả reports
6. **Kho tài liệu**: Tìm kiếm file theo tên, lọc theo engagement

**Điểm nhấn**: Chief Auditor có quyền xem toàn bộ hệ thống, dashboard tổng thể

---

## Kịch bản 2: Manager — Quản lý Engagement End-to-End

**Mục tiêu**: Thể hiện full workflow từ tạo engagement đến close

### Phần A: Tạo & Chuẩn bị

1. **Đăng nhập** bằng tài khoản Manager (Trần Thị Bình)
2. **Tạo engagement mới**:
   - Tên: "Demo Kiểm toán Mua sắm Q1-2026"
   - Mô tả: "Kiểm toán quy trình mua sắm tập trung"
   - Ngày bắt đầu / kết thúc
3. **Phân công team**: Thêm auditor (Phạm Thị Dung, Hoàng Văn Em)
4. **Chuyển ACTIVE**: Click nút chuyển trạng thái → Toast success
5. **Tạo tasks**:
   - "Kiểm tra hồ sơ thầu" — phân công Dung
   - "Đối chiếu chứng từ" — phân công Em
6. **Chuyển FIELDWORK**

### Phần B: Review & Signoff (dùng engagement có sẵn)

7. Vào **"Kiểm toán CNTT Q1-2026"** (đang FIELDWORK)
8. Xem task đã có preparer signoff → **Approve** (reviewer signoff)
   - Thử approve task chưa có preparer signoff → hiện lỗi
9. **Reject** một task → ghi comment → toast success

### Phần C: Báo cáo & Đóng

10. Vào engagement đang REPORTING
11. Xem report → chuyển DRAFT → REVIEW → FINAL → **ISSUED** (locked)
12. Xem finding → **Close** finding (cần evidence + REMEDIATED status)
13. **Lịch sử**: Click "Lịch sử" xem activity log

**Điểm nhấn**: Manager quản lý toàn bộ lifecycle, signoff review, báo cáo

---

## Kịch bản 3: Auditor — Thực hiện & Upload Evidence

**Mục tiêu**: Thể hiện quy trình thực hiện kiểm toán hàng ngày

1. **Đăng nhập** bằng tài khoản Auditor (Phạm Thị Dung)
2. **Dashboard**: Xem "Công việc của tôi" — chỉ tasks được phân công
3. Vào task → **Cập nhật status**: TODO → IN_PROGRESS → Toast success
4. **Upload evidence**:
   - Upload file PDF hoặc Excel → Toast success
   - Thử upload file `.exe` → Toast error (bị từ chối)
   - Thử upload file > 50MB → Toast error
5. **Hoàn thành task**: Chuyển sang COMPLETED
6. **Preparer Signoff**: Click "Xác nhận hoàn thành" → status chuyển PENDING_REVIEW
7. **Tạo Finding**: Tạo finding mới cho engagement
   - Title, mô tả, risk rating, khuyến nghị
8. Upload remediation evidence vào finding

**Điểm nhấn**: Auditor chỉ thao tác trên scope được phân công, signoff workflow rõ ràng

---

## Kịch bản 4: Edge Cases & Error Handling

**Mục tiêu**: Thể hiện hệ thống xử lý lỗi tốt

1. **404 page**: Truy cập `/dashboard/nonexistent` → trang 404 styled
2. **Upload bất thường**:
   - File `.exe` → "Loại file không được phép"
   - File quá lớn → "File quá lớn"
   - File double extension (`report.pdf.exe`) → bị từ chối
3. **Đóng engagement khi còn task chưa duyệt** → Toast error kèm số task
4. **Preparer = Reviewer** → Lỗi "phải là hai người khác nhau"
5. **Upload vào task APPROVED** → bị từ chối (nút ẩn)
6. **Sửa report ISSUED** → không hiển thị nút sửa (locked)

---

## Lưu ý cho người trình diễn

- Mở browser DevTools (Network tab) để demo performance nếu cần
- Seed data có sẵn audit logs — activity log đã có dữ liệu
- Nếu cần reset: `npm run db:seed` (chạy lại seed)
- Dùng 2 browser (hoặc incognito) để demo 2 roles cùng lúc
