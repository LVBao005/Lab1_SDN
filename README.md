# Ứng dụng Quản lý Công việc & Đội nhóm (Task & Team Management)
> **Bài tập lớn: Assignment 1**  
> **Công nghệ xây dựng**: Next.js (App Router, TypeScript) · Tailwind CSS · PostgreSQL (Supabase) · Prisma ORM

---

## 📖 1. Giới thiệu tổng quan

Ứng dụng **Task & Team Management** là giải pháp quản lý công việc và tổ chức đội nhóm dành cho cá nhân và nhóm làm việc. Hệ thống cho phép:
- **Quản lý công việc trực tiếp (Không cần đăng nhập)**: Tạo task với validation tiêu đề, xem danh sách task dưới dạng Card hoặc Table, cập nhật trạng thái nhanh, chỉnh sửa thông tin chi tiết và xóa task.
- **Bộ lọc thông minh (Status Filter)**: Lọc theo *All*, *To Do*, *In Progress*, *Done*.
- **Tự động cập nhật UI**: Real-time state update sau khi Create, Update, Delete mà không cần reload trang thủ công.
- **Mở rộng Đội nhóm (Teams - Coming Soon)**: Định nghĩa sẵn cấu trúc cơ sở dữ liệu cho User, Team, TeamMember và trang placeholder `/teams`.
- **Cơ sở dữ liệu đám mây PostgreSQL**: Kết nối với dịch vụ Supabase thông qua Prisma ORM.

---

## 🏗️ 2. Cấu trúc thư mục dự án

```text
├── app/
│   ├── api/
│   │   ├── tasks/
│   │   │   ├── route.ts          # GET /api/tasks (lọc status), POST /api/tasks
│   │   │   └── [id]/
│   │   │       └── route.ts      # PUT /api/tasks/[id], DELETE /api/tasks/[id]
│   │   └── db-status/
│   │       └── route.ts          # GET /api/db-status (kiểm tra kết nối Supabase)
│   ├── teams/
│   │   └── page.tsx              # Trang placeholder "Teams (Coming soon)"
│   ├── login/
│   │   └── page.tsx              # Trang Đăng nhập tài khoản demo
│   ├── globals.css               # Cấu hình Tailwind CSS (@import "tailwindcss")
│   ├── layout.tsx                # Next.js Root Layout
│   └── page.tsx                  # Trang chủ quản lý Task (App Router)
├── components/
│   ├── Navbar.tsx                # Thanh điều hướng (Home, Teams, Login, DB status)
│   ├── TaskForm.tsx              # Form tạo task mới với validation
│   ├── TaskList.tsx              # Danh sách task (Card & Table views, bộ lọc)
│   └── EditTaskModal.tsx         # Modal chỉnh sửa task
├── lib/
│   └── prisma.ts                 # Khởi tạo Prisma Client an toàn (Singleton)
├── types/
│   ├── task.ts                   # Khai báo TypeScript Interfaces & Enums
│   └── index.ts                  # Export các định nghĩa types
├── prisma/
│   ├── schema.prisma             # Định nghĩa Models: User, Team, TeamMember, Task
│   └── seed.ts                   # Dữ liệu khởi tạo mẫu lên PostgreSQL Supabase
├── postcss.config.mjs            # Cấu hình PostCSS với @tailwindcss/postcss
├── tsconfig.json                 # Cấu hình TypeScript cho Next.js App Router
├── .env.example                  # Mẫu biến môi trường an toàn (không chứa secret)
├── .env                          # Biến môi trường cục bộ (đã bị chặn bởi .gitignore)
├── package.json                  # Cấu hình scripts chuẩn Next.js (dev, build, start)
└── README.md
```

---

## 🗄️ 3. Cấu trúc Cơ sở dữ liệu (Database Schema)

Hệ thống sử dụng **PostgreSQL** kết hợp **Prisma ORM** với 4 model quan hệ:

### 3.1. Model `User` (Người dùng)
- `id` (String - CUID, Khóa chính)
- `name` (String, Tùy chọn)
- `email` (String, Duy nhất `@unique`)
- `password` (String - mật khẩu mã hóa)
- `createdAt` (DateTime - mặc định thời gian hiện tại)
- *Quan hệ*: Sở hữu các `Team` (`ownedTeams`), thành viên các nhóm (`memberships`), nhận các task (`tasks`).

### 3.2. Model `Team` (Đội nhóm)
- `id` (String - CUID, Khóa chính)
- `name` (String - Tên nhóm)
- `description` (String, Tùy chọn)
- `ownerId` (String - ID người tạo nhóm, tham chiếu `User.id`)
- `createdAt` (DateTime)
- *Quan hệ*: Thuộc về `User` (owner), có nhiều `TeamMember` và `Task`.

### 3.3. Model `TeamMember` (Thành viên nhóm)
- `id` (String - CUID, Khóa chính)
- `teamId` (String - tham chiếu `Team.id`)
- `userId` (String - tham chiếu `User.id`)
- `role` (Enum: `OWNER`, `ADMIN`, `MEMBER`, mặc định `MEMBER`)
- `joinedAt` (DateTime)
- *Ràng buộc*: `@unique([teamId, userId])` - một user chỉ tham gia 1 team 1 lần.

### 3.4. Model `Task` (Công việc)
- `id` (String - CUID, Khóa chính)
- `title` (String - Bắt buộc)
- `description` (String, Tùy chọn)
- `status` (Enum: `TODO`, `IN_PROGRESS`, `DONE`, mặc định `TODO`)
- `priority` (Enum: `LOW`, `MEDIUM`, `HIGH`, mặc định `MEDIUM`)
- `dueDate` (DateTime, Tùy chọn)
- `teamId` (String, Tùy chọn - tham chiếu `Team.id`)
- `assigneeId` (String, Tùy chọn - tham chiếu `User.id`)
- `createdAt` (DateTime)

---

## 🌐 4. Chi tiết các API Endpoints

| Phương thức | Đường dẫn URL | Mô tả chức năng | Request Body / Query |
|---|---|---|---|
| `GET` | `/api/tasks` | Lấy danh sách task | `?status=TODO` (Tùy chọn) |
| `POST` | `/api/tasks` | Tạo task mới | `{ title*, description, status, priority, dueDate }` |
| `PUT` | `/api/tasks/[id]` | Cập nhật task | `{ title, description, status, priority, dueDate }` |
| `DELETE` | `/api/tasks/[id]`| Xóa task theo ID | *None* |

---

## 🚀 5. Hướng dẫn chạy dự án cục bộ (Local Setup)

### Bước 1: Clone và Cài đặt dependencies
```bash
git clone <repository-url>
cd assignment1-task-management
npm install
```

### Bước 2: Cấu hình biến môi trường
Tạo file `.env` ở thư mục gốc (hoặc sao chép từ `.env.example`):
```env
# Dùng Transaction Pooler (port 6543) cho ứng dụng
DATABASE_URL="postgresql://postgres.[YOUR_PROJECT_REF]:[YOUR_PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true"

# Dùng Session Mode (port 5432) cho Prisma migrate / db push
DIRECT_URL="postgresql://postgres.[YOUR_PROJECT_REF]:[YOUR_PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres"
```
> *Lưu ý quan trọng:* 
> - Thay thế `[YOUR_PROJECT_REF]`, `[YOUR_PASSWORD]` và `[REGION]` bằng thông tin database Supabase thực tế của bạn.
> - Trong chuỗi kết nối URL, nếu mật khẩu của bạn chứa ký tự đặc biệt (như `@`, `#`, `$`), hãy mã hóa URL tương ứng (ví dụ: ký tự `@` cần được mã hóa thành `%40`) để tránh xung đột cú pháp kết nối.
> - Tuyệt đối không commit file `.env` chứa mật khẩu thực tế lên GitHub (file `.gitignore` đã được cấu hình chặn file `.env`).

### Bước 3: Khởi tạo và Migrate Cơ sở dữ liệu
Chạy các lệnh Prisma để sinh Prisma Client và đồng bộ schema lên PostgreSQL Supabase:
```bash
# 1. Sinh Prisma Client
npx prisma generate

# 2. Đồng bộ cấu trúc bảng lên Supabase
npx prisma db push

# 3. Nạp dữ liệu mẫu lên Supabase (User, Team, Tasks)
npm run prisma:seed
```

### Bước 4: Khởi động máy chủ phát triển (Development Server)
```bash
npm run dev
```
Mở trình duyệt tại: [http://localhost:3000](http://localhost:3000)

### Bước 5: Kiểm tra Prisma Studio (Tùy chọn)
Nếu bạn muốn xem giao diện quản trị cơ sở dữ liệu trực quan:
```bash
npx prisma studio
```
Truy cập [http://localhost:5555](http://localhost:5555) để xem các bảng dữ liệu `users`, `teams`, `team_members`, `tasks`.

---

## 🧪 6. Kiểm tra & Đánh giá Tiêu chuẩn Assignment 1

- [x] **Cấu trúc Next.js App Router**: Đầy đủ `app/layout.tsx`, `app/page.tsx`, `app/teams/page.tsx`, `app/api/tasks/route.ts`, `app/api/tasks/[id]/route.ts`.
- [x] **Cấu hình Prisma**: File `prisma/schema.prisma` kết nối PostgreSQL với 4 models chuẩn xác.
- [x] **API Route Handlers**: Hỗ trợ đầy đủ GET, POST, PUT, DELETE với mã phản hồi HTTP chuẩn (200, 201, 400, 404, 500).
- [x] **Form Validation**: Kiểm tra tiêu đề task bắt buộc, hiển thị thông báo lỗi rõ ràng.
- [x] **Real-time UI**: Giao diện cập nhật ngay lập tức sau Create, Update, Delete mà không cần F5 trình duyệt.
- [x] **Responsive UI**: Tối ưu hóa hiển thị trên mọi kích cỡ màn hình (Mobile, Tablet, Desktop) với Tailwind CSS.
- [x] **Trang Teams (Coming soon)**: Hiển thị giao diện placeholder đẹp mắt tại `/teams`.
- [x] **Cấu hình ESLint & Prettier**: Thiết lập file cấu hình chuẩn mực.
