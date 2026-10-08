import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';

// GET /api/tasks - Retrieve tasks (optional ?status=, ?teamId= filter)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const teamId = searchParams.get('teamId');

    const tasks = await prisma.task.findMany({
      where: {
        ...(status && status !== 'ALL' && { status: status as any }),
        ...(teamId && { teamId }),
      },
      orderBy: { createdAt: 'desc' },
      include: {
        team: {
          select: { id: true, name: true },
        },
        assignee: {
          select: { id: true, name: true, email: true },
        },
        creator: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    return NextResponse.json(tasks, { status: 200 });
  } catch (error) {
    console.error('Error fetching tasks from database:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tasks', details: (error as Error).message },
      { status: 500 },
    );
  }
}

// POST /api/tasks - Create a new task
export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthUser(request);
    const body = await request.json();
    const { title, description, status, priority, dueDate, teamId, assigneeId } = body;

    if (!title || typeof title !== 'string' || title.trim() === '') {
      return NextResponse.json(
        { error: 'Task title is required' },
        { status: 400 },
      );
    }

    const newTask = await prisma.task.create({
      data: {
        title: title.trim(),
        description: description?.trim() || null,
        status: status || 'TODO',
        priority: priority || 'MEDIUM',
        dueDate: dueDate ? new Date(dueDate) : null,
        teamId: teamId || null,
        assigneeId: assigneeId || null,
        creatorId: authUser ? authUser.id : null,
      },
      include: {
        team: {
          select: { id: true, name: true },
        },
        assignee: {
          select: { id: true, name: true, email: true },
        },
        creator: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    return NextResponse.json(newTask, { status: 201 });
  } catch (error) {
    console.error('Error creating task:', error);
    return NextResponse.json(
      { error: 'Failed to create task', details: (error as Error).message },
      { status: 500 },
    );
  }
}
