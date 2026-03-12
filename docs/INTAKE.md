# INTAKE – YouEngage

## 1. Mục tiêu

- Xây dựng hệ thống web nội bộ giúp Ban Kiểm toán nội bộ quản lý tập trung workflow của từng cuộc kiểm toán (engagement).
- Thay thế quy trình quản lý thủ công (email, file share, Excel tracking) bằng một hệ thống có cấu trúc, có trạng thái, có signoff, có audit trail.
- Nếu thành công, sau 6–12 tháng:
  - Toàn bộ engagements được quản lý trên hệ thống.
  - Lãnh đạo kiểm toán nhìn thấy tiến độ real-time qua dashboard.
  - Hồ sơ kiểm toán được lưu trữ tập trung, tra cứu được, retention 10–20 năm.
  - Quy trình signoff (preparer / reviewer) được kiểm soát chặt chẽ.

## 2. Đối tượng

### Người dùng trực tiếp:
- **Trưởng ban kiểm toán**: xem dashboard tổng thể, giám sát tiến độ, xem findings.
- **Manager / Trưởng nhóm kiểm toán**: quản lý engagement, phân công, review, signoff, quản lý findings.
- **Auditor / Member**: thực hiện task, upload hồ sơ, preparer signoff, phản hồi review.
- **System Admin**: cấu hình SSO, quản lý user/role, danh mục hệ thống, backup/restore.

### Vấn đề hiện tại:
- Không có hệ thống tập trung để theo dõi tiến độ engagement.
- Signoff thủ công, không có audit trail rõ ràng.
- Hồ sơ kiểm toán phân tán trên file share, khó tra cứu.
- Lãnh đạo phải hỏi từng người để biết tình trạng cuộc kiểm toán.

## 3. Bối cảnh & ràng buộc

- **Triển khai**: On-premise (không cloud public).
- **Xác thực**: Microsoft SSO (Entra ID / OIDC) — bắt buộc.
- **Quy mô**: 10–20 users, khoảng 10 engagements/năm.
- **Retention**: Hồ sơ kiểm toán cần lưu trữ 10–20 năm.
- **License**: Không phát sinh license thương mại bắt buộc — open-source-first.
- **Auditee**: KHÔNG đăng nhập hệ thống (không có external portal).
- **Tài liệu kiểm toán**: Khách hàng đã có sẵn biểu mẫu Word, Excel, PDF — hệ thống chỉ quản lý metadata + cho phép upload/attach.

## 4. Phạm vi dự kiến (Draft Scope)

### Chắc chắn phải có (Phase 1):
1. Authentication & Access Control (Microsoft SSO)
2. Engagement Management
3. Planning & Audit Setup
4. Execution & Workpapers
5. Signoff Workflow (Preparer / Reviewer)
6. Reporting
7. Findings Follow-up
8. Document Repository, Dashboard & Audit Trail

### KHÔNG nằm trong phạm vi Phase 1:
- Annual audit plan / audit universe / risk assessment đầu năm
- Auditee portal / external login
- Multi-level reviewer chain
- Template management engine / template versioning
- Document template builder / auto-generate workpapers from templates
- Dynamic form builder phức tạp
- Mobile app
- AI features
- BI nâng cao

## 5. Tài nguyên hiện có

- Khách hàng đã có bộ biểu mẫu kiểm toán (Word, Excel, PDF) dùng nhiều năm.
- Hạ tầng Microsoft (Active Directory, Entra ID) đã sẵn sàng.
- Server on-prem có khả năng chạy Docker.

## 6. Ưu tiên & tiêu chí thành công

### Ưu tiên Phase 1:
1. Quản lý được engagement end-to-end: từ tạo engagement → planning → execution → signoff → report → close.
2. Signoff workflow hoạt động đúng business rules (preparer ≠ reviewer, signoff tuần tự).
3. Upload/attach tài liệu vào đúng bước trong luồng audit.
4. Dashboard cho lãnh đạo thấy tiến độ.

### Dự án được coi là thành công nếu:
- Ban kiểm toán dùng hệ thống để quản lý ít nhất 1 engagement hoàn chỉnh.
- Signoff workflow được tuân thủ, có audit trail.
- Hồ sơ kiểm toán được lưu trữ tập trung, tra cứu được.

## 7. Ghi chú thêm

### Business Rules bắt buộc:
1. Preparer và Reviewer phải là hai người khác nhau.
2. Reviewer signoff chỉ được thực hiện sau khi Preparer đã signoff.
3. Auditee không đăng nhập hệ thống.
4. Khách hàng tiếp tục sử dụng file biểu mẫu có sẵn — hệ thống là attachment-driven, không phải template engine.
5. Final report phải có trạng thái khóa sau khi finalized/issued.
6. Finding chỉ được close sau khi có validation phù hợp.
7. Engagement không được đóng nếu còn hạng mục bắt buộc chưa hoàn tất signoff.

### Rủi ro đã nhìn thấy:
- Adoption: cần training để đội kiểm toán quen với workflow mới.
- Data migration: hồ sơ cũ trên file share có thể cần import sau.
- SSO integration: phụ thuộc vào IT cấp quyền Entra ID app registration.
