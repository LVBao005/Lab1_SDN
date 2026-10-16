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
  console.log('🌱 Đang khởi tạo dữ liệu mẫu cho Assignment 3 & 4 (Seeding)...');

  const defaultPasswordHash = await hashPassword('Password123!');

  // 1. Tạo Test Account 1 cho Grader (Chấm điểm - Owner)
  const graderUser = await prisma.user.upsert({
    where: { email: 'grader@assignment2.edu.vn' },
    update: {
      password: defaultPasswordHash,
      name: 'Grader Tester (Owner)',
    },
    create: {
      name: 'Grader Tester (Owner)',
      email: 'grader@assignment2.edu.vn',
      password: defaultPasswordHash,
    },
  });
  console.log('✅ User Grader đã tạo:', graderUser.name, `(${graderUser.email})`);

  // 2. Tạo Test Account 2 (Admin / Collaborator cùng team với Grader)
  const memberUser = await prisma.user.upsert({
    where: { email: 'member@assignment2.edu.vn' },
    update: {
      password: defaultPasswordHash,
      name: 'Alex Developer (Admin)',
    },
    create: {
      name: 'Alex Developer (Admin)',
      email: 'member@assignment2.edu.vn',
      password: defaultPasswordHash,
    },
  });
  console.log('✅ User Member đã tạo:', memberUser.name, `(${memberUser.email})`);

  // 3. Tạo User sinh viên (Student / Regular Member)
  const studentEmail = process.env.STUDENT_EMAIL || 'student@example.com';
  const studentUser = await prisma.user.upsert({
    where: { email: studentEmail },
    update: {
      password: defaultPasswordHash,
      name: 'Lê Văn Bảo (Member)',
    },
    create: {
      name: 'Lê Văn Bảo (Member)',
      email: studentEmail,
      password: defaultPasswordHash,
    },
  });
  console.log('✅ User Sinh viên đã tạo:', studentUser.name, `(${studentUser.email})`);

  // 4. Tạo Team mẫu 1: Core Engineering
  const team1 = await prisma.team.upsert({
    where: { id: 'team_core_eng' },
    update: {
      name: 'Core Engineering',
      description: 'Nhóm kỹ thuật phát triển sản phẩm Task & Team Management với Real-time Chat và Kanban',
      ownerId: graderUser.id,
    },
    create: {
      id: 'team_core_eng',
      name: 'Core Engineering',
      description: 'Nhóm kỹ thuật phát triển sản phẩm Task & Team Management với Real-time Chat và Kanban',
      ownerId: graderUser.id,
    },
  });
  console.log('✅ Team 1 đã tạo:', team1.name);

  // 5. Gán thành viên cho Team 1 với 3 vai trò rõ rệt:
  // - Grader: OWNER
  // - Alex: ADMIN
  // - Bảo: MEMBER
  await prisma.teamMember.upsert({
    where: { teamId_userId: { teamId: team1.id, userId: graderUser.id } },
    update: { role: 'OWNER' },
    create: { teamId: team1.id, userId: graderUser.id, role: 'OWNER' },
  });

  await prisma.teamMember.upsert({
    where: { teamId_userId: { teamId: team1.id, userId: memberUser.id } },
    update: { role: 'ADMIN' },
    create: { teamId: team1.id, userId: memberUser.id, role: 'ADMIN' },
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

  // 7. Tạo danh sách công việc mẫu
  const sampleTasks = [
    {
      id: 'task_001',
      title: 'Xây dựng tính năng Real-time Team Chat',
      description: 'Hỗ trợ nhắn tin tức thời qua WebSockets / Supabase Realtime kèm lịch sử lưu trong Postgres.',
      status: 'DONE' as const,
      priority: 'HIGH' as const,
      dueDate: new Date(Date.now() + 86400000 * 2),
      teamId: team1.id,
      assigneeId: memberUser.id,
      creatorId: graderUser.id,
    },
    {
      id: 'task_002',
      title: 'Live Task Board Synchronization',
      description: 'Khi một thành viên tạo, sửa hoặc xóa task, các phiên khác trên Kanban board tự động cập nhật ngay lập tức.',
      status: 'IN_PROGRESS' as const,
      priority: 'HIGH' as const,
      dueDate: new Date(Date.now() + 86400000 * 4),
      teamId: team1.id,
      assigneeId: memberUser.id,
      creatorId: graderUser.id,
    },
    {
      id: 'task_003',
      title: 'Hệ thống thông báo In-App Notification Center',
      description: 'Hiển thị chuông thông báo kèm số lượng chưa đọc khi được giao việc hoặc thêm vào nhóm.',
      status: 'DONE' as const,
      priority: 'MEDIUM' as const,
      dueDate: new Date(Date.now() + 86400000 * 5),
      teamId: team1.id,
      assigneeId: studentUser.id,
      creatorId: graderUser.id,
    },
    {
      id: 'task_004',
      title: 'Kiểm thử phân quyền 3 cấp (Owner, Admin, Member)',
      description: 'Owner có toàn quyền xóa team, Admin quản lý thành viên & task, Member chỉ quản lý task của mình.',
      status: 'TODO' as const,
      priority: 'HIGH' as const,
      dueDate: new Date(Date.now() + 86400000 * 7),
      teamId: team1.id,
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

  // 8. Tạo tin nhắn mẫu cho kênh chat Team 1
  const sampleMessages = [
    {
      id: 'msg_001',
      teamId: team1.id,
      senderId: graderUser.id,
      content: 'Chào mừng cả đội đến với kênh trò chuyện Real-time của nhóm Core Engineering! 👋',
      createdAt: new Date(Date.now() - 3600000 * 3),
    },
    {
      id: 'msg_002',
      teamId: team1.id,
      senderId: memberUser.id,
      content: 'Chào sếp! Tôi vừa cập nhật tiến độ công việc trên bảng Kanban live.',
      createdAt: new Date(Date.now() - 3600000 * 2),
    },
    {
      id: 'msg_003',
      teamId: team1.id,
      senderId: studentUser.id,
      content: 'Real-time WebSocket đang hoạt động rất mượt mà trên Vercel!',
      createdAt: new Date(Date.now() - 1800000),
    },
  ];

  for (const msg of sampleMessages) {
    await prisma.message.upsert({
      where: { id: msg.id },
      update: { content: msg.content },
      create: msg,
    });
  }
  console.log(`✅ Đã tạo ${sampleMessages.length} tin nhắn mẫu trong Team Chat!`);

  // 9. Tạo thông báo mẫu cho Grader và Member
  const sampleNotifications = [
    {
      id: 'notif_001',
      userId: graderUser.id,
      title: 'Chào mừng bạn đến với TaskFlow',
      content: 'Hệ thống Real-time Collaboration & In-App Notification đã sẵn sàng.',
      type: 'SYSTEM' as const,
      isRead: false,
      link: `/teams/${team1.id}`,
      createdAt: new Date(Date.now() - 7200000),
    },
    {
      id: 'notif_002',
      userId: memberUser.id,
      title: 'Bạn được giao một công việc mới',
      content: 'Bạn được giao công việc "Live Task Board Synchronization".',
      type: 'TASK_ASSIGNED' as const,
      isRead: false,
      link: `/teams/${team1.id}`,
      createdAt: new Date(Date.now() - 3600000),
    },
    {
      id: 'notif_003',
      userId: memberUser.id,
      title: 'Vai trò trong nhóm đã thay đổi',
      content: 'Bạn đã được chỉ định vai trò Quản trị viên (Admin) trong nhóm "Core Engineering".',
      type: 'ROLE_UPDATED' as const,
      isRead: true,
      link: `/teams/${team1.id}`,
      createdAt: new Date(Date.now() - 10800000),
    },
  ];

  for (const notif of sampleNotifications) {
    await prisma.notification.upsert({
      where: { id: notif.id },
      update: { title: notif.title, content: notif.content },
      create: notif,
    });
  }
  console.log(`✅ Đã tạo ${sampleNotifications.length} thông báo mẫu!`);

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
