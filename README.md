# Ứng dụng Quản lý Công việc & Đội nhóm (Task & Team Management App)
> **Bài tập lớn: Assignment 2 – Task & Team Management App: CRUD API with Authentication**  
> **Công nghệ phát triển**: Next.js 15 (App Router, Route Handlers, TypeScript) · Tailwind CSS · PostgreSQL (Supabase) · Prisma ORM · Jose (JWT) · BcryptJS

---

## 📖 1. Giới thiệu tổng quan

Ứng dụng **Task & Team Management** là nền tảng quản lý công việc và tổ chức đội nhóm trực quan, bảo mật và đa người dùng. Kế thừa và mở rộng từ Assignment 1, phiên bản Assignment 2 hoàn thiện toàn bộ hệ thống xác thực, phân quyền theo vai trò (RBAC), xây dựng hệ thống 13 RESTful CRUD API endpoints và giao diện Kanban Board tương tác hiện đại:

1. **Hệ thống Xác thực Người dùng (Authentication)**:
   - Đăng ký tài khoản (`/register`) với tên, email và mật khẩu (mã hóa an toàn bằng `bcryptjs`).
   - Đăng nhập (`/login`) với cơ chế cấp mã thông báo JWT (chuẩn HS256, hạn 7 ngày) được lưu trữ qua `HTTP-only Cookie` an toàn (kèm hỗ trợ Bearer Authorization header).
   - Đăng xuất (`/api/auth/logout`) và xóa session tức thì.
   - Bảo vệ phân quyền truy cập: Người dùng chưa đăng nhập chỉ được xem trang chủ giới thiệu và trang đăng nhập/đăng ký. Toàn bộ tính năng đội nhóm và công việc yêu cầu xác thực.
   - Hỗ trợ tài khoản kiểm thử có sẵn và cơ chế tự đăng ký tài khoản dùng được ngay (không yêu cầu bước xác nhận email phức tạp).

2. **Quản lý Đội nhóm (Team Management & RBAC)**:
   - Người dùng đăng nhập có thể tạo mới đội nhóm và tự động trở thành **Chủ sở hữu (Owner)** của nhóm đó.
   - Chủ sở hữu nhóm có toàn quyền cập nhật thông tin nhóm, xóa nhóm, mời thành viên mới qua email và xóa thành viên khỏi nhóm.
   - Mỗi thành viên có vai trò rõ ràng: `OWNER` hoặc `MEMBER`.
   - Một người dùng có thể tham gia nhiều nhóm và chuyển đổi giữa các nhóm linh hoạt tại trang tổng quan `/teams`.

3. **Quản lý Công việc (Task Management)**:
   - Mọi thành viên trong nhóm đều có quyền tạo công việc mới (`TODO`, `IN_PROGRESS`, `DONE`) với mức độ ưu tiên (`LOW`, `MEDIUM`, `HIGH`), hạn chót (`dueDate`) và phân công (`assignee`) cho thành viên cụ thể trong nhóm.
   - Thành viên có quyền cập nhật tiến độ, mức độ ưu tiên và chi tiết nội dung công việc.
   - **Phân quyền xóa công việc chặt chẽ (RBAC Deletion)**: Chỉ có **Người tạo công việc (Creator)**, **Người được phân công (Assignee)** hoặc **Chủ sở hữu nhóm (Team Owner)** mới có quyền xóa công việc.

4. **Giao diện Người dùng Hiện đại & Tính năng Nâng cao (Bonus Features)**:
   - **Kanban Board**: Phân cột trực quan theo 3 trạng thái công việc với nút thao tác chuyển đổi trạng thái nhanh.
   - **Chế độ xem linh hoạt**: Chuyển đổi mượt mà giữa chế độ Kanban Board và Bảng dữ liệu (Table View).
   - **Bộ lọc & Tìm kiếm Real-time**: Lọc công việc theo trạng thái, mức độ ưu tiên, người phụ trách và tìm kiếm theo từ khóa.

---

## 🏗️ 2. Cấu trúc thư mục dự án

```text
├── app/
│   ├── api/
│   │   ├── auth/
│   │   │   ├── register/route.ts       # POST /api/auth/register (Đăng ký tài khoản)
│   │   │   ├── login/route.ts          # POST /api/auth/login (Đăng nhập & cấp JWT)
│   │   │   ├── logout/route.ts         # POST /api/auth/logout (Đăng xuất)
│   │   │   └── me/route.ts             # GET /api/auth/me (Lấy thông tin phiên hiện tại)
│   │   ├── teams/
│   │   │   ├── route.ts                # GET /api/teams, POST /api/teams
│   │   │   └── [id]/
│   │   │       ├── route.ts            # GET, PUT, DELETE /api/teams/[id]
│   │   │       ├── members/
│   │   │       │   ├── route.ts        # POST /api/teams/[id]/members (Thêm thành viên)
│   │   │       │   └── [userId]/
│   │   │       │       └── route.ts    # DELETE /api/teams/[id]/members/[userId] (Xóa thành viên)
│   │   │       └── tasks/
│   │   │           └── route.ts        # GET, POST /api/teams/[id]/tasks (Task của nhóm)
│   │   ├── tasks/
│   │   │   ├── route.ts                # GET, POST /api/tasks (Toàn cục)
│   │   │   └── [id]/
│   │   │       └── route.ts            # PUT, DELETE /api/tasks/[id] (RBAC Task update & delete)
│   │   └── db-status/
│   │       └── route.ts                # GET /api/db-status (Kiểm tra kết nối Supabase)
│   ├── login/
│   │   └── page.tsx                    # Giao diện Đăng nhập tài khoản
│   ├── register/
│   │   └── page.tsx                    # Giao diện Đăng ký tài khoản người dùng
│   ├── teams/
│   │   ├── page.tsx                    # Dashboard danh sách các nhóm đã tham gia
│   │   └── [id]/
│   │       └── page.tsx                # Trang chi tiết nhóm (Kanban, Table, Quản lý thành viên)
│   ├── globals.css                     # Tailwind CSS v4 styling
│   ├── layout.tsx                      # Root Layout tích hợp AuthProvider
│   └── page.tsx                        # Trang chủ (Landing view & Dashboard tóm tắt)
├── components/
│   ├── Navbar.tsx                      # Điều hướng người dùng, trạng thái DB & nút Logout
│   ├── TaskForm.tsx                    # Form tạo công việc cơ bản
│   ├── TaskList.tsx                    # Danh sách hiển thị công việc (Table & Card)
│   ├── EditTaskModal.tsx               # Modal cập nhật công việc
│   └── Footer.tsx                      # Chân trang thông tin đồ án
├── lib/
│   ├── prisma.ts                       # Khởi tạo Prisma Client Singleton an toàn
│   ├── auth.ts                         # Mã hóa bcrypt, ký/giải mã JWT, Cookie helpers
│   └── auth-context.tsx                # React Context quản lý phiên đăng nhập toàn ứng dụng
├── types/
│   ├── task.ts                         # Định nghĩa kiểu dữ liệu User, Team, Task, Enum
│   └── index.ts                        # Re-export các types
├── prisma/
│   ├── schema.prisma                   # Định nghĩa 4 thực thể: User, Team, TeamMember, Task
│   └── seed.ts                         # Kịch bản nạp dữ liệu mẫu và tài khoản test
├── .env.example                        # Mẫu biến môi trường an toàn (không chứa secret)
├── package.json                        # Khai báo thư viện và scripts vận hành dự án
└── README.md
```

---

## 🗄️ 3. Sơ đồ Thực thể Quan hệ (ERD) & Cấu trúc Database

```mermaid
erDiagram
    User ||--o{ Team : "owns (1:N)"
    User ||--o{ TeamMember : "has memberships (1:N)"
    User ||--o{ Task : "assigned to (1:N)"
    User ||--o{ Task : "created by (1:N)"
    Team ||--o{ TeamMember : "includes (1:N)"
    Team ||--o{ Task : "contains (1:N)"

    User {
        string id PK "cuid()"
        string name "optional"
        string email UK "unique"
        string password "hashed bcrypt"
        datetime createdAt
    }

    Team {
        string id PK "cuid()"
        string name
        string description "optional"
        string ownerId FK "references User.id"
        datetime createdAt
    }

    TeamMember {
        string id PK "cuid()"
        string teamId FK "references Team.id"
        string userId FK "references User.id"
        MemberRole role "OWNER | ADMIN | MEMBER"
        datetime joinedAt
    }

    Task {
        string id PK "cuid()"
        string title
        string description "optional"
        TaskStatus status "TODO | IN_PROGRESS | DONE"
        TaskPriority priority "LOW | MEDIUM | HIGH"
        datetime dueDate "optional"
        string teamId FK "references Team.id"
        string assigneeId FK "references User.id"
        string creatorId FK "references User.id"
        datetime createdAt
    }
```

---

## 🌐 4. Danh sách 13 RESTful API Endpoints (CRUD)

| STT | Phương thức | Đường dẫn URL | Mô tả chức năng & Phân quyền | Request Body / Query Params |
| :---: | :---: | :--- | :--- | :--- |
| **1** | `POST` | `/api/auth/register` | Đăng ký tài khoản người dùng mới | `{ name, email, password }` |
| **2** | `POST` | `/api/auth/login` | Đăng nhập hệ thống, sinh session/JWT | `{ email, password }` |
| **3** | `GET` | `/api/teams` | Lấy danh sách các nhóm mà user hiện tại tham gia | *Header Bearer / Cookie* |
| **4** | `POST` | `/api/teams` | Tạo nhóm mới (User tự động trở thành Owner) | `{ name, description? }` |
| **5** | `GET` | `/api/teams/:id` | Xem chi tiết nhóm, danh sách thành viên và task | *Thành viên của nhóm* |
| **6** | `PUT` | `/api/teams/:id` | Cập nhật tên/mô tả nhóm (**Chỉ Owner**) | `{ name?, description? }` |
| **7** | `DELETE` | `/api/teams/:id` | Xóa hoàn toàn đội nhóm (**Chỉ Owner**) | *Không có body* |
| **8** | `POST` | `/api/teams/:id/members` | Thêm thành viên vào nhóm theo email (**Chỉ Owner**) | `{ email, role?: "MEMBER" \| "OWNER" }` |
| **9** | `DELETE` | `/api/teams/:id/members/:userId` | Xóa thành viên khỏi nhóm (**Chỉ Owner**) | *Không có body* |
| **10** | `GET` | `/api/teams/:id/tasks` | Lấy danh sách task của nhóm kèm bộ lọc & tìm kiếm | `?status=&priority=&assigneeId=&search=` |
| **11** | `POST` | `/api/teams/:id/tasks` | Tạo công việc mới thuộc nhóm (Bất kỳ member nào) | `{ title, description?, status, priority, dueDate?, assigneeId? }` |
| **12** | `PUT` | `/api/tasks/:id` | Cập nhật thông tin task (Bất kỳ member nào trong nhóm) | `{ title?, description?, status?, priority?, dueDate?, assigneeId? }` |
| **13** | `DELETE` | `/api/tasks/:id` | Xóa task (**Chỉ Creator, Assignee hoặc Team Owner**) | *Không có body* |

*(Đính kèm endpoint tiện ích: `POST /api/auth/logout` để đăng xuất an toàn và `GET /api/db-status` để kiểm tra kết nối database).*

---

## 🚀 5. Hướng dẫn Khởi chạy Dự án Cục bộ (Local Setup)

### Bước 1: Sao chép mã nguồn và Cài đặt gói thư viện
```bash
git clone https://github.com/LVBao005/Lab1_SDN.git
cd Lab1_SDN
npm install
```

### Bước 2: Thiết lập Biến Môi trường
Tạo file `.env` ở thư mục gốc (sao chép từ `.env.example`):
```env
# URL kết nối cơ sở dữ liệu PostgreSQL (Supabase Transaction Pooler, cổng 6543)
DATABASE_URL="postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true"

# URL kết nối trực tiếp phục vụ Prisma Migrations (cổng 5432)
DIRECT_URL="postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres"

# Chuỗi khóa bí mật dùng để ký và xác thực JWT token (tối thiểu 32 ký tự)
JWT_SECRET="your-super-secret-jwt-key-min-32-chars-change-me"
```
> *Lưu ý an toàn*: Thay thế `[PROJECT_REF]`, `[PASSWORD]` và `[REGION]` bằng thông số dự án Supabase cá nhân. Không commit file `.env` thật lên kho mã nguồn công khai.

### Bước 3: Đồng bộ Prisma và Nạp dữ liệu kiểm thử (Seeding)
```bash
# 1. Sinh mã nguồn Prisma Client
npm run prisma:generate

# 2. Đồng bộ Schema lên PostgreSQL Supabase
npx prisma db push

# 3. Nạp tài khoản kiểm thử và dữ liệu mẫu cho Assignment 2
npm run prisma:seed
```

### Bước 4: Khởi động Ứng dụng
```bash
npm run dev
```
Truy cập hệ thống tại: [http://localhost:3000](http://localhost:3000)

---

## 🛡️ 6. Kiểm định & Đánh giá Tiêu chuẩn (Self-Assessment Checklist)

- [x] **Xác thực JWT nội bộ an toàn**: Lưu HttpOnly Cookie, bảo vệ các route `/teams` và `/teams/[id]`.
- [x] **Mô hình Dữ liệu Đầy đủ**: Quan hệ 4 bảng `User`, `Team`, `TeamMember`, `Task` với các ràng buộc khóa ngoại và Cascade delete.
- [x] **Hoàn thành 13/13 RESTful CRUD APIs**: Chuẩn mã trạng thái HTTP (200, 201, 400, 401, 403, 404, 500).
- [x] **Phân quyền theo vai trò (RBAC)**: Chỉ Owner được sửa/xóa team, thêm/xóa member; Chỉ Creator/Assignee/Owner được xóa task.
- [x] **Giao diện Kanban & Bảng**: Thao tác linh hoạt, hiển thị nhãn độ ưu tiên và trạng thái trực quan.
- [x] **Bộ lọc & Tìm kiếm công việc**: Hoạt động mượt mà, phản hồi ngay lập tức.
- [x] **Build & Linting**: Vượt qua kiểm tra `npm run lint` và `npm run build` thành công 100%.
