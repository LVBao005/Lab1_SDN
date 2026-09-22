import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { prisma } from './lib/prisma.ts';

dotenv.config({ override: true });

// In-memory fallback task store for instant preview resilience if Supabase password is not yet entered
interface StoredTask {
  id: string;
  title: string;
  description: string | null;
  status: 'TODO' | 'IN_PROGRESS' | 'DONE';
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  dueDate: string | null;
  teamId: string | null;
  assigneeId: string | null;
  createdAt: string;
  team?: { id: string; name: string } | null;
  assignee?: { id: string; name: string | null; email: string } | null;
}

let fallbackTasks: StoredTask[] = [
  {
    id: 'task_001',
    title: 'Thiết kế Prisma Schema cho User, Team, Task',
    description: 'Xác định các Model trong schema.prisma với quan hệ 1-N và N-N theo yêu cầu Assignment 1.',
    status: 'DONE',
    priority: 'HIGH',
    dueDate: new Date(Date.now() + 86400000 * 2).toISOString(),
    teamId: 'team_01',
    assigneeId: 'user_01',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    team: { id: 'team_01', name: 'Core Engineering' },
  },
  {
    id: 'task_002',
    title: 'Xây dựng API Endpoints trong App Router',
    description: 'Triển khai GET /api/tasks, POST /api/tasks, PUT /api/tasks/[id], DELETE /api/tasks/[id].',
    status: 'DONE',
    priority: 'HIGH',
    dueDate: new Date(Date.now() + 86400000 * 3).toISOString(),
    teamId: 'team_01',
    assigneeId: 'user_01',
    createdAt: new Date().toISOString(),
    team: { id: 'team_01', name: 'Core Engineering' },
  },
  {
    id: 'task_003',
    title: 'Kết nối cơ sở dữ liệu PostgreSQL trên Supabase',
    description: 'Cấu hình DATABASE_URL trong file .env và chạy prisma migrate dev.',
    status: 'IN_PROGRESS',
    priority: 'MEDIUM',
    dueDate: new Date(Date.now() + 86400000 * 5).toISOString(),
    teamId: 'team_01',
    assigneeId: null,
    createdAt: new Date().toISOString(),
    team: { id: 'team_01', name: 'DevOps' },
  },
  {
    id: 'task_004',
    title: 'Hoàn thiện giao diện Teams (Coming Soon)',
    description: 'Tạo trang placeholder và định hướng cấu trúc mở rộng nhóm cho giai đoạn tiếp theo.',
    status: 'TODO',
    priority: 'LOW',
    dueDate: new Date(Date.now() + 86400000 * 7).toISOString(),
    teamId: null,
    assigneeId: null,
    createdAt: new Date().toISOString(),
  },
];

let isPrismaAvailable = false;
let dbCheckDone = false;

async function testDatabaseConnection(): Promise<boolean> {
  const dbUrl = process.env.DATABASE_URL || '';
  if (!dbUrl || dbUrl.includes('YOUR_PASSWORD')) {
    console.log('[Database] Notice: DATABASE_URL contains placeholder "YOUR_PASSWORD". Using fallback in-memory store for instant preview testing.');
    isPrismaAvailable = false;
    dbCheckDone = true;
    return false;
  }

  try {
    // Quick test query
    await prisma.$queryRaw`SELECT 1`;
    isPrismaAvailable = true;
    console.log('[Database] Connected to PostgreSQL (Supabase) via Prisma ORM!');
    return true;
  } catch (err: any) {
    console.warn('[Database] Prisma connection test failed:', err.message);
    console.log('[Database] Operating with resilient fallback store.');
    isPrismaAvailable = false;
    return false;
  } finally {
    dbCheckDone = true;
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Test DB connection asynchronously
  testDatabaseConnection();

  // API 1: DB Status Endpoint
  app.get('/api/db-status', async (req, res) => {
    const dbUrl = process.env.DATABASE_URL || '';
    const hasPassword = !dbUrl.includes('YOUR_PASSWORD');

    res.json({
      connected: isPrismaAvailable,
      provider: 'PostgreSQL (Supabase) + Prisma ORM',
      hasConfiguredPassword: hasPassword,
      message: isPrismaAvailable
        ? 'Đã kết nối PostgreSQL Supabase qua Prisma'
        : hasPassword
        ? 'Đang thử kết nối database Supabase...'
        : 'Cần cập nhật mật khẩu thật trong biến DATABASE_URL tại file .env',
      activeStore: isPrismaAvailable ? 'Prisma (Supabase)' : 'Resilient Store (Active)',
    });
  });

  // API 2: GET /api/tasks
  app.get('/api/tasks', async (req, res) => {
    const statusFilter = req.query.status as string | undefined;

    if (isPrismaAvailable) {
      try {
        const tasks = await prisma.task.findMany({
          where: statusFilter && statusFilter !== 'ALL' ? { status: statusFilter as any } : undefined,
          orderBy: { createdAt: 'desc' },
          include: {
            team: { select: { id: true, name: true } },
            assignee: { select: { id: true, name: true, email: true } },
          },
        });
        return res.json(tasks);
      } catch (err) {
        console.error('Error querying Prisma tasks, falling back to local store:', err);
      }
    }

    // Fallback store
    let filtered = [...fallbackTasks];
    if (statusFilter && statusFilter !== 'ALL') {
      filtered = filtered.filter((t) => t.status === statusFilter);
    }
    filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return res.json(filtered);
  });

  // API 3: POST /api/tasks
  app.post('/api/tasks', async (req, res) => {
    try {
      const { title, description, status, priority, dueDate, teamId, assigneeId } = req.body;

      if (!title || typeof title !== 'string' || title.trim() === '') {
        return res.status(400).json({ error: 'Task title is required' });
      }

      const trimmedTitle = title.trim();
      const validStatus = status || 'TODO';
      const validPriority = priority || 'MEDIUM';

      if (isPrismaAvailable) {
        try {
          const created = await prisma.task.create({
            data: {
              title: trimmedTitle,
              description: description?.trim() || null,
              status: validStatus,
              priority: validPriority,
              dueDate: dueDate ? new Date(dueDate) : null,
              teamId: teamId || null,
              assigneeId: assigneeId || null,
            },
            include: {
              team: { select: { id: true, name: true } },
              assignee: { select: { id: true, name: true, email: true } },
            },
          });
          return res.status(201).json(created);
        } catch (dbErr: any) {
          console.error('Prisma task creation error:', dbErr.message);
        }
      }

      // Fallback in-memory creation
      const newTask: StoredTask = {
        id: `task_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
        title: trimmedTitle,
        description: description?.trim() || null,
        status: validStatus,
        priority: validPriority,
        dueDate: dueDate || null,
        teamId: teamId || null,
        assigneeId: assigneeId || null,
        createdAt: new Date().toISOString(),
      };

      fallbackTasks.unshift(newTask);
      return res.status(201).json(newTask);
    } catch (err: any) {
      console.error('Error creating task:', err);
      return res.status(500).json({ error: 'Internal server error', details: err.message });
    }
  });

  // API 4: PUT /api/tasks/:id
  app.put('/api/tasks/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const { title, description, status, priority, dueDate, teamId, assigneeId } = req.body;

      if (isPrismaAvailable) {
        try {
          const updated = await prisma.task.update({
            where: { id },
            data: {
              ...(title !== undefined && { title: title.trim() }),
              ...(description !== undefined && { description: description?.trim() || null }),
              ...(status !== undefined && { status }),
              ...(priority !== undefined && { priority }),
              ...(dueDate !== undefined && { dueDate: dueDate ? new Date(dueDate) : null }),
              ...(teamId !== undefined && { teamId: teamId || null }),
              ...(assigneeId !== undefined && { assigneeId: assigneeId || null }),
            },
            include: {
              team: { select: { id: true, name: true } },
              assignee: { select: { id: true, name: true, email: true } },
            },
          });
          return res.json(updated);
        } catch (dbErr: any) {
          console.error('Prisma task update error:', dbErr.message);
        }
      }

      // Fallback
      const index = fallbackTasks.findIndex((t) => t.id === id);
      if (index === -1) {
        return res.status(404).json({ error: 'Task not found' });
      }

      const existing = fallbackTasks[index];
      const updated: StoredTask = {
        ...existing,
        title: title !== undefined ? title.trim() : existing.title,
        description: description !== undefined ? description?.trim() || null : existing.description,
        status: status !== undefined ? status : existing.status,
        priority: priority !== undefined ? priority : existing.priority,
        dueDate: dueDate !== undefined ? dueDate : existing.dueDate,
        teamId: teamId !== undefined ? teamId : existing.teamId,
        assigneeId: assigneeId !== undefined ? assigneeId : existing.assigneeId,
      };

      fallbackTasks[index] = updated;
      return res.json(updated);
    } catch (err: any) {
      console.error('Error updating task:', err);
      return res.status(500).json({ error: 'Internal server error', details: err.message });
    }
  });

  // API 5: DELETE /api/tasks/:id
  app.delete('/api/tasks/:id', async (req, res) => {
    try {
      const { id } = req.params;

      if (isPrismaAvailable) {
        try {
          await prisma.task.delete({
            where: { id },
          });
          return res.json({ message: 'Task deleted successfully', id });
        } catch (dbErr: any) {
          console.error('Prisma task delete error:', dbErr.message);
        }
      }

      // Fallback
      const index = fallbackTasks.findIndex((t) => t.id === id);
      if (index === -1) {
        return res.status(404).json({ error: 'Task not found' });
      }

      fallbackTasks.splice(index, 1);
      return res.json({ message: 'Task deleted successfully', id });
    } catch (err: any) {
      console.error('Error deleting task:', err);
      return res.status(500).json({ error: 'Internal server error', details: err.message });
    }
  });

  // Vite middleware setup
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Server] Task & Team Management running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
