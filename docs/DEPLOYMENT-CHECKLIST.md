# Deployment Checklist — Hướng dẫn triển khai

**Dự án**: YouEngage — Internal Audit Workflow Management
**Target**: Docker Compose on-premises

---

## Pre-deployment

### 1. Yêu cầu Server

- [ ] Linux server (Ubuntu 22.04+ recommended)
- [ ] Docker Engine 24+
- [ ] Docker Compose v2 (plugin, not standalone)
- [ ] Tối thiểu 2GB RAM, 2 vCPU
- [ ] Disk: 20GB+ (tuỳ khối lượng file upload)
- [ ] Port 3000 (hoặc APP_PORT tùy chọn) mở cho mạng nội bộ

### 2. Microsoft Entra ID Setup

- [ ] Azure Portal → Microsoft Entra ID → App registrations → New registration
- [ ] Name: `YouEngage`
- [ ] Supported account types: Single tenant
- [ ] Redirect URI: `https://your-domain:3000/api/auth/callback/microsoft-entra-id`
- [ ] Certificates & secrets → New client secret → Copy value
- [ ] Ghi lại: Application (client) ID, Client secret, Directory (tenant) ID

### 3. Cấu hình Environment

```bash
cp .env.example .env
```

Sửa file `.env`:

| Biến | Mô tả | Ví dụ |
|------|--------|-------|
| `DB_PASSWORD` | Mật khẩu PostgreSQL | `strong-random-password` |
| `AUTH_SECRET` | Secret cho NextAuth (openssl rand -base64 32) | `abc123...` |
| `AUTH_URL` | URL public của ứng dụng | `https://audit.company.com:3000` |
| `AUTH_MICROSOFT_ENTRA_ID_ID` | Azure Client ID | `xxxxxxxx-xxxx-...` |
| `AUTH_MICROSOFT_ENTRA_ID_SECRET` | Azure Client Secret | `xxxxxxxx...` |
| `AUTH_MICROSOFT_ENTRA_ID_TENANT_ID` | Azure Tenant ID | `xxxxxxxx-xxxx-...` |
| `UPLOAD_DIR` | (Optional) Thư mục lưu file | `./uploads` |
| `MAX_FILE_SIZE_MB` | (Optional) Giới hạn file size | `50` |

---

## Deployment

### 4. Build & Start

```bash
# Clone repository
git clone <repo-url> YouEngage
cd YouEngage

# Build và start tất cả services
docker compose up -d --build

# Kiểm tra services đang chạy
docker compose ps

# Xem logs
docker compose logs -f app
```

### 5. Database Migration

```bash
# Chạy migration
docker compose exec app npx prisma migrate deploy

# Seed dữ liệu demo (chỉ lần đầu, optional)
docker compose exec app npx prisma db seed
```

### 6. Tạo thư mục Uploads

```bash
mkdir -p uploads
chmod 775 uploads
```

### 7. Xác nhận hoạt động

- [ ] `docker compose ps` — tất cả services "Up"
- [ ] Truy cập `http://server:3000` → hiện trang Login
- [ ] Đăng nhập SSO thành công → Dashboard
- [ ] Upload file test → thành công
- [ ] Download file test → file đúng

---

## Post-deployment

### 8. Phân quyền User

User mới qua SSO mặc định là `auditor`. Để thay đổi role:

```bash
# Mở Prisma Studio (dev mode)
docker compose exec app npx prisma studio

# Hoặc dùng SQL trực tiếp
docker compose exec db psql -U youengage youengage -c \
  "UPDATE \"User\" SET role = 'manager' WHERE email = 'user@company.com';"
```

Roles: `admin`, `chief_auditor`, `manager`, `auditor`

### 9. Backup Schedule

```bash
# Backup database (chạy hàng ngày via cron)
docker compose exec db pg_dump -U youengage youengage > backup_$(date +%Y%m%d_%H%M%S).sql

# Backup uploads
tar -czf uploads_backup_$(date +%Y%m%d).tar.gz uploads/
```

### 10. Monitoring

```bash
# Kiểm tra health
docker compose ps

# Xem logs gần nhất
docker compose logs --tail=100 app

# Disk usage (uploads)
du -sh uploads/
```

---

## Troubleshooting

| Vấn đề | Giải pháp |
|--------|-----------|
| SSO redirect lỗi | Kiểm tra Redirect URI trong Azure Portal khớp AUTH_URL |
| Database connection failed | Kiểm tra DB_PASSWORD trong .env khớp docker-compose |
| Upload failed | Kiểm tra thư mục uploads tồn tại và có quyền ghi |
| File download lỗi | Kiểm tra UPLOAD_DIR trong .env đúng path |
| Out of disk | Kiểm tra `du -sh uploads/`, dọn dẹp hoặc mở rộng disk |

---

## Cập nhật phiên bản

```bash
git pull
docker compose up -d --build
docker compose exec app npx prisma migrate deploy
```

**Lưu ý**: Luôn backup database trước khi cập nhật.
