import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config({ override: true });

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Đang khởi tạo dữ liệu mẫu (Seeding) lên PostgreSQL Supabase...');

  // 1. Tạo User mẫu
  const user = await prisma.user.upsert({
    where: { email: 'baole.tanquoc@gmail.com' },
    update: {},
    create: {
      id: 'user_01',
      name: 'Lê Văn Bảo',
      email: 'baole.tanquoc@gmail.com',
      password: 'hashed_sample_password_123',
    },
  });
  console.log('✅ User đã tạo:', user.name, `(${user.email})`);

  // 2. Tạo Team mẫu
  const team = await prisma.team.upsert({
    where: { id: 'team_01' },
    update: {},
    create: {
      id: 'team_01',
      name: 'Core Engineering',
      description: 'Đội ngũ kỹ thuật phát triển sản phẩm Task & Team Management',
      ownerId: user.id,
    },
  });
  console.log('✅ Team đã tạo:', team.name);

  // 3. Gán User vào Team với role OWNER
  await prisma.teamMember.upsert({
    where: { teamId_userId: { teamId: team.id, userId: user.id } },
    update: {},
    create: {
      teamId: team.id,
      userId: user.id,
      role: 'OWNER',
    },
  });
  console.log('✅ TeamMember đã gán:', user.name, '-> OWNER');

  // 4. Tạo các Task mẫu
  const sampleTasks = [
    {
      id: 'task_001',
      title: 'Thiết kế Prisma Schema cho User, Team, Task',
      description: 'Xác định các Model trong schema.prisma với quan hệ 1-N và N-N theo yêu cầu Assignment 1.',
      status: 'DONE' as const,
      priority: 'HIGH' as const,
      dueDate: new Date(Date.now() + 86400000 * 2),
      teamId: team.id,
      assigneeId: user.id,
    },
    {
      id: 'task_002',
      title: 'Kết nối cơ sở dữ liệu PostgreSQL trên Supabase',
      description: 'Cấu hình DATABASE_URL trong file .env và chạy prisma db push / migrate.',
      status: 'DONE' as const,
      priority: 'HIGH' as const,
      dueDate: new Date(Date.now() + 86400000 * 3),
      teamId: team.id,
      assigneeId: user.id,
    },
    {
      id: 'task_003',
      title: 'Xây dựng API Endpoints trong App Router',
      description: 'Triển khai GET /api/tasks, POST /api/tasks, PUT /api/tasks/[id], DELETE /api/tasks/[id].',
      status: 'IN_PROGRESS' as const,
      priority: 'MEDIUM' as const,
      dueDate: new Date(Date.now() + 86400000 * 5),
      teamId: team.id,
      assigneeId: user.id,
    },
    {
      id: 'task_004',
      title: 'Hoàn thiện giao diện Teams (Coming Soon)',
      description: 'Tạo trang placeholder và định hướng cấu trúc mở rộng nhóm cho giai đoạn tiếp theo.',
      status: 'TODO' as const,
      priority: 'LOW' as const,
      dueDate: new Date(Date.now() + 86400000 * 7),
      teamId: null,
      assigneeId: null,
    },
  ];

  for (const task of sampleTasks) {
    await prisma.task.upsert({
      where: { id: task.id },
      update: {},
      create: task,
    });
  }

  console.log(`✅ Đã tạo thành công ${sampleTasks.length} task mẫu trên Supabase.`);
}

main()
  .catch((e) => {
    console.error('❌ Lỗi seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
