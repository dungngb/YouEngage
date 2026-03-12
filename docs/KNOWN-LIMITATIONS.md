# Known Limitations — Giới hạn đã biết

**Dự án**: YouEngage — Internal Audit Workflow Management
**Phiên bản**: Phase 5 (Pilot Readiness)
**Ngày cập nhật**: 2026-03-04

---

## 1. Phạm vi hiện tại

YouEngage Phase 1–5 bao gồm:
- Authentication (Microsoft Entra ID SSO)
- Engagement management (lifecycle, team assignment)
- Task/workpaper execution & signoff workflow
- Reporting (report lifecycle, locking)
- Findings follow-up (lifecycle, remediation, close validation)
- Document repository (upload, search, filter)
- Dashboard (role-based)
- Audit trail (immutable logs)
- File handling hardening (MIME validation, sanitization, security headers)

## 2. Không nằm trong phạm vi (By Design)

Các tính năng sau **không nằm trong phạm vi** và sẽ không được xây dựng trừ khi có yêu cầu riêng:

| Tính năng | Lý do loại trừ |
|-----------|---------------|
| Annual audit planning | Khách hàng dùng Excel/công cụ riêng |
| Template engine / document generation | Hệ thống là attachment-driven, không generate document |
| AI / tự động hóa | Ngoài phạm vi MVP |
| External portal (cho auditee) | Chỉ phục vụ internal audit team |
| GRC suite integration | Không có yêu cầu tích hợp |
| Email notifications | Không có SMTP server requirement |
| Real-time collaboration | Không yêu cầu WebSocket |
| Mobile app | Web-only, responsive layout |
| Multi-language | Chỉ tiếng Việt |
| Audit report PDF generation | Khách hàng tự soạn báo cáo bên ngoài |

## 3. Giới hạn kỹ thuật

### Authentication
- Chỉ hỗ trợ Microsoft Entra ID (không có local login)
- Role mặc định cho user mới: `auditor` — phải thay đổi thủ công qua DB
- Không có UI quản lý role (dùng Prisma Studio hoặc SQL)

### File Upload
- Giới hạn: 50MB/file (cấu hình qua `MAX_FILE_SIZE_MB`)
- Chỉ cho phép: PDF, Word, Excel, PowerPoint, Image, Text/CSV, ZIP/RAR
- File lưu local filesystem — không có cloud storage integration
- Xóa file là hard delete (xóa cả file trên disk và record trong DB)
- Không có versioning (upload mới = file mới, không thay thế)

### Database
- PostgreSQL single instance (không cluster/replica)
- Backup thủ công via `pg_dump` (không có automated backup)
- Audit log không có retention policy (giữ mãi)

### Performance
- Dashboard queries chưa có caching
- Document search chỉ tìm theo tên file (không full-text search nội dung)
- Attachment list giới hạn 100 records mỗi trang (không có pagination)

### Security
- MIME type validation cross-check extension vs Content-Type header (browser-reported, không magic-byte check)
- Không có antivirus scanning cho uploaded files
- Không có rate limiting trên upload endpoint
- Session management: JWT tokens, không có forced logout

### UI/UX
- Không có document preview inline (chỉ download)
- Không có drag-and-drop upload
- Không có notification panel (chỉ có badge counts trên sidebar)
- Không có bulk operations (multi-select tasks, findings, etc.)
- Print stylesheet chưa có

## 4. Các Workaround Đã Biết

| Tình huống | Workaround |
|-----------|-----------|
| Cần thay đổi role user | Dùng SQL: `UPDATE "User" SET role = '...' WHERE email = '...'` |
| Upload file lớn hơn 50MB | Chia nhỏ file hoặc nén ZIP (cấu hình `MAX_FILE_SIZE_MB` nếu cần) |
| Cần xem nội dung file | Download về máy → mở bằng ứng dụng tương ứng |
| Backup tự động | Thiết lập cron job cho `pg_dump` và `tar` backup |
| Quên signoff task | Manager có thể reject → auditor rework → re-signoff |
| Engagement đóng nhầm | Không hỗ trợ mở lại CLOSED engagement (cần can thiệp DB) |

## 5. Roadmap Khả Thi (Nếu Có Yêu Cầu)

Nếu khách hàng yêu cầu mở rộng sau pilot, các tính năng sau **khả thi về kỹ thuật**:

1. Email notifications (cần SMTP config)
2. Document preview (PDF inline viewer)
3. Pagination cho danh sách dài
4. Full-text search (Prisma + PostgreSQL tsvector)
5. Dashboard caching (Redis hoặc in-memory)
6. Role management UI (admin page)
7. Soft delete cho files (đánh dấu xóa thay vì xóa thật)
8. Automated backup script

---

*Tài liệu này cần được review trước mỗi lần triển khai và cập nhật khi có thay đổi.*
