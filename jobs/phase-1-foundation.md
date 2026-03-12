# JOB-001 – Phase 1 Foundation: Project Setup & Auth

## 1. Bối cảnh dự án

- **Tên dự án**: YouEngage — Internal Audit Workflow Management System.
- **Link tới INTAKE.md**: `docs/INTAKE.md`
- **Link tới BLUEPRINT.md**: `docs/BLUEPRINT.md`
- **Link tới CONTRACT.md**: `docs/CONTRACT.md`

## 2. Mục tiêu của job này

- Khởi tạo codebase Next.js + TypeScript + Tailwind CSS.
- Thiết lập Docker Compose với PostgreSQL.
- Tạo Prisma schema cho các entity nền tảng (User, Role, Session).
- Tích hợp Microsoft SSO (Entra ID / OIDC) cho authentication.
- Thiết lập role-based access control middleware.
- Tạo seed data cho roles và test users.
- Liên quan tới: **Gate 1 – Project Setup & Auth**.

## 3. Phạm vi công việc

### Thư mục / file sẽ tạo hoặc ảnh hưởng:
```
src/
├── app/                    # Next.js App Router
│   ├── layout.tsx
│   ├── page.tsx            # Landing / redirect to dashboard
│   ├── login/
│   ├── dashboard/
│   └── api/
│       └── auth/           # NextAuth.js routes
├── components/
│   └── ui/                 # Shared UI components
├── lib/
│   ├── prisma.ts           # Prisma client singleton
│   ├── auth.ts             # Auth configuration
│   └── middleware.ts       # Role-based access
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
├── docker-compose.yml
├── Dockerfile
├── .env.example
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

### Hành vi mới mong muốn:
1. `docker compose up` → PostgreSQL + app chạy.
2. Truy cập app → redirect sang Microsoft SSO login.
3. Login thành công → redirect về dashboard theo role.
4. Routes được bảo vệ bởi middleware (unauthorized → redirect login).
5. Mỗi role thấy menu/content khác nhau (placeholder).

## 4. Ràng buộc kỹ thuật

### Stack:
- Next.js 14+ (App Router)
- TypeScript (strict mode)
- Tailwind CSS
- Prisma ORM
- PostgreSQL 15+
- NextAuth.js / Auth.js với Azure AD provider
- Docker + Docker Compose

### Thư viện ưu tiên:
- `next-auth` (hoặc `@auth/nextjs`) — SSO integration.
- `@prisma/client` + `prisma` — ORM.
- `tailwindcss` — styling.
- `zod` — input validation.

### Thư viện tránh dùng:
- Không dùng ORM khác ngoài Prisma.
- Không dùng CSS framework khác ngoài Tailwind.
- Không dùng state management library phức tạp (Redux, MobX...).

### Coding convention:
- File naming: kebab-case.
- Component naming: PascalCase.
- API routes: RESTful convention.
- Environment variables: `.env.local` (dev), `.env.production` (prod).
- Không hardcode secrets.

## 5. Định nghĩa "xong" cho JOB-001

### Điều kiện chấp nhận:
- [ ] `docker compose up` khởi động được PostgreSQL + app không lỗi.
- [ ] Prisma migrate tạo được tables: User, Role, Account, Session.
- [ ] Truy cập `/` → redirect sang login nếu chưa auth.
- [ ] Login bằng Microsoft SSO → redirect về `/dashboard`.
- [ ] Logout hoạt động.
- [ ] Middleware chặn unauthorized access.
- [ ] Seed data tạo được 4 roles (Trưởng ban, Manager, Auditor, Admin).
- [ ] `.env.example` có đủ biến cần thiết.
- [ ] README có hướng dẫn setup dev environment.

### Cách test:
- Chạy `docker compose up` và truy cập `http://localhost:3000`.
- Login bằng Microsoft account (hoặc test account).
- Kiểm tra DB có đủ tables và seed data.
- Thử truy cập route protected khi chưa login → bị chặn.

## 6. Ghi chú cho Ông thợ

- SSO cần Entra ID app registration — chuẩn bị `.env.example` rõ ràng để khách hàng tự cấu hình.
- Nếu chưa có Entra ID credentials, dùng mock/placeholder nhưng code phải sẵn sàng cho production SSO.
- PostgreSQL connection string dùng Docker internal network.
- Prisma schema nên thiết kế sẵn cho expansion (Gate 2 sẽ thêm Engagement, Task...) nhưng chỉ migrate những gì cần cho Gate 1.
- Layout chung nên có sidebar navigation placeholder (sẽ build thêm ở Gate 2+).
- Không cần UI đẹp ở gate này — functional first, polish ở Gate 5.
