import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config({ override: true });

const prisma = new PrismaClient();

async function hashPassword(password: string) {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

async function main() {
  console.log('🌱 Đang khởi tạo dữ liệu mẫu cho Assignment 2 (Seeding)...');

  const defaultPasswordHash = await hashPassword('Password123!');

  // 1. Tạo Test Account cho Grader (Chấm điểm)
  const graderUser = await prisma.user.upsert({
    where: { email: 'grader@assignment2.edu.vn' },
    update: {
      password: defaultPasswordHash,
      name: 'Grader Tester',
    },
    create: {
      name: 'Grader Tester',
      email: 'grader@assignment2.edu.vn',
      password: defaultPasswordHash,
    },
  });
  console.log('✅ User Grader đã tạo:', graderUser.name, `(${graderUser.email})`);

  // 2. Tạo User sinh viên Lê Văn Bảo
  const studentUser = await prisma.user.upsert({
    where: { email: 'baole.tanquoc@gmail.com' },
    update: {
      password: defaultPasswordHash,
      name: 'Lê Văn Bảo',
    },
    create: {
      name: 'Lê Văn Bảo',
      email: 'baole.tanquoc@gmail.com',
      password: defaultPasswordHash,
    },
  });
  console.log('✅ User Sinh viên đã tạo:', studentUser.name, `(${studentUser.email})`);

  // 3. Tạo User thành viên mẫu Alex Developer
  const memberUser = await prisma.user.upsert({
    where: { email: 'member@assignment2.edu.vn' },
    update: {
      password: defaultPasswordHash,
      name: 'Alex Developer',
    },
    create: {
      name: 'Alex Developer',
      email: 'member@assignment2.edu.vn',
      password: defaultPasswordHash,
    },
  });
  console.log('✅ User Member đã tạo:', memberUser.name, `(${memberUser.email})`);

  // 4. Tạo Team mẫu 1: Core Engineering
  const team1 = await prisma.team.upsert({
    where: { id: 'team_core_eng' },
    update: {
      name: 'Core Engineering',
      description: 'Nhóm kỹ thuật phát triển sản phẩm Task & Team Management',
      ownerId: graderUser.id,
    },
    create: {
      id: 'team_core_eng',
      name: 'Core Engineering',
      description: 'Nhóm kỹ thuật phát triển sản phẩm Task & Team Management',
      ownerId: graderUser.id,
    },
  });
  console.log('✅ Team 1 đã tạo:', team1.name);

  // 5. Gán thành viên cho Team 1
  await prisma.teamMember.upsert({
    where: { teamId_userId: { teamId: team1.id, userId: graderUser.id } },
    update: { role: 'OWNER' },
    create: { teamId: team1.id, userId: graderUser.id, role: 'OWNER' },
  });

  await prisma.teamMember.upsert({
    where: { teamId_userId: { teamId: team1.id, userId: memberUser.id } },
    update: { role: 'MEMBER' },
    create: { teamId: team1.id, userId: memberUser.id, role: 'MEMBER' },
  });

  await prisma.teamMember.upsert({
    where: { teamId_userId: { teamId: team1.id, userId: studentUser.id } },
    update: { role: 'MEMBER' },
    create: { teamId: team1.id, userId: studentUser.id, role: 'MEMBER' },
  });

  // 6. Tạo Team mẫu 2: Product & Design
  const team2 = await prisma.team.upsert({
    where: { id: 'team_product_design' },
    update: {
      name: 'Product & Design',
      description: 'Nhóm thiết kế trải nghiệm người dùng UI/UX và kế hoạch phát hành',
      ownerId: graderUser.id,
    },
    create: {
      id: 'team_product_design',
      name: 'Product & Design',
      description: 'Nhóm thiết kế trải nghiệm người dùng UI/UX và kế hoạch phát hành',
      ownerId: graderUser.id,
    },
  });
  console.log('✅ Team 2 đã tạo:', team2.name);

  await prisma.teamMember.upsert({
    where: { teamId_userId: { teamId: team2.id, userId: graderUser.id } },
    update: { role: 'OWNER' },
    create: { teamId: team2.id, userId: graderUser.id, role: 'OWNER' },
  });

  await prisma.teamMember.upsert({
    where: { teamId_userId: { teamId: team2.id, userId: memberUser.id } },
    update: { role: 'MEMBER' },
    create: { teamId: team2.id, userId: memberUser.id, role: 'MEMBER' },
  });

  // 7. Tạo danh sách công việc mẫu có phân công và creator
  const sampleTasks = [
    {
      id: 'task_001',
      title: 'Xây dựng RESTful API cho Teams và Tasks',
      description: 'Triển khai đầy đủ các endpoint CRUD với kiểm tra quyền Owner và Member.',
      status: 'DONE' as const,
      priority: 'HIGH' as const,
      dueDate: new Date(Date.now() + 86400000 * 2),
      teamId: team1.id,
      assigneeId: memberUser.id,
      creatorId: graderUser.id,
    },
    {
      id: 'task_002',
      title: 'Thiết kế giao diện Kanban Board chuyển đổi linh hoạt',
      description: 'Hỗ trợ kéo hoặc đổi trạng thái công việc trực quan giữa To Do, In Progress, Done.',
      status: 'IN_PROGRESS' as const,
      priority: 'MEDIUM' as const,
      dueDate: new Date(Date.now() + 86400000 * 4),
      teamId: team1.id,
      assigneeId: memberUser.id,
      creatorId: graderUser.id,
    },
    {
      id: 'task_003',
      title: 'Kiểm thử phân quyền xóa Task (RBAC)',
      description: 'Đảm bảo chỉ Task Creator, Assignee hoặc Team Owner mới có quyền xóa task.',
      status: 'TODO' as const,
      priority: 'HIGH' as const,
      dueDate: new Date(Date.now() + 86400000 * 5),
      teamId: team1.id,
      assigneeId: studentUser.id,
      creatorId: graderUser.id,
    },
    {
      id: 'task_004',
      title: 'Hoàn thiện tài liệu nộp bài Assignment 2',
      description: 'Điền đầy đủ thông tin vào tài liệu nộp bài và kiểm tra link Vercel hoạt động.',
      status: 'TODO' as const,
      priority: 'LOW' as const,
      dueDate: new Date(Date.now() + 86400000 * 7),
      teamId: team1.id,
      assigneeId: graderUser.id,
      creatorId: graderUser.id,
    },
    {
      id: 'task_005',
      title: 'Thiết kế UI Mockup cho Team Detail và Member List',
      description: 'Lựa chọn bảng màu tối ưu và icon trực quan cho danh sách thành viên.',
      status: 'DONE' as const,
      priority: 'MEDIUM' as const,
      dueDate: new Date(Date.now() + 86400000 * 3),
      teamId: team2.id,
      assigneeId: memberUser.id,
      creatorId: graderUser.id,
    },
    {
      id: 'task_006',
      title: 'Kiểm tra độ tương thích trên thiết bị di động (Responsive)',
      description: 'Tối ưu hóa layout Drawer, Table và Kanban cho màn hình nhỏ.',
      status: 'IN_PROGRESS' as const,
      priority: 'LOW' as const,
      dueDate: new Date(Date.now() + 86400000 * 6),
      teamId: team2.id,
      assigneeId: graderUser.id,
      creatorId: graderUser.id,
    },
  ];

  for (const task of sampleTasks) {
    await prisma.task.upsert({
      where: { id: task.id },
      update: {
        title: task.title,
        description: task.description,
        status: task.status,
        priority: task.priority,
        dueDate: task.dueDate,
        teamId: task.teamId,
        assigneeId: task.assigneeId,
        creatorId: task.creatorId,
      },
      create: task,
    });
  }

  console.log(`✅ Đã tạo thành công ${sampleTasks.length} công việc mẫu có phân quyền!`);
  console.log('🚀 Quá trình Seeding hoàn tất thành công!');
}

main()
  .catch((e) => {
    console.error('❌ Lỗi khi chạy seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
