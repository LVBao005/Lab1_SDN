import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';

// Helper to check if user belongs to the team
async function isUserTeamMember(teamId: string, userId: string): Promise<boolean> {
  const team = await prisma.team.findUnique({
    where: { id: teamId },
    include: {
      members: {
        where: { userId },
      },
    },
  });

  if (!team) return false;
  return team.ownerId === userId || team.members.length > 0;
}

// GET /api/teams/:id/tasks - List tasks for a team
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser) {
      return NextResponse.json(
        { error: 'Unauthorized. Please login to view team tasks.' },
        { status: 401 },
      );
    }

    const { id: teamId } = await context.params;
    const isMember = await isUserTeamMember(teamId, authUser.id);

    if (!isMember) {
      return NextResponse.json(
        { error: 'Forbidden. You are not a member of this team.' },
        { status: 403 },
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');
    const assigneeId = searchParams.get('assigneeId');
    const search = searchParams.get('search');

    const tasks = await prisma.task.findMany({
      where: {
        teamId,
        ...(status && status !== 'ALL' && { status: status as any }),
        ...(priority && priority !== 'ALL' && { priority: priority as any }),
        ...(assigneeId && assigneeId !== 'ALL' && { assigneeId }),
        ...(search && {
          OR: [
            { title: { contains: search, mode: 'insensitive' } },
            { description: { contains: search, mode: 'insensitive' } },
          ],
        }),
      },
      orderBy: { createdAt: 'desc' },
      include: {
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
    console.error('Error fetching team tasks:', error);
    return NextResponse.json(
      { error: 'Failed to fetch team tasks', details: (error as Error).message },
      { status: 500 },
    );
  }
}

// POST /api/teams/:id/tasks - Create a new task within a team
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser) {
      return NextResponse.json(
        { error: 'Unauthorized. Please login to create tasks.' },
        { status: 401 },
      );
    }

    const { id: teamId } = await context.params;
    const isMember = await isUserTeamMember(teamId, authUser.id);

    if (!isMember) {
      return NextResponse.json(
        { error: 'Forbidden. Only team members can create tasks in this team.' },
        { status: 403 },
      );
    }

    const body = await request.json();
    const { title, description, status, priority, dueDate, assigneeId } = body;

    if (!title || typeof title !== 'string' || title.trim() === '') {
      return NextResponse.json(
        { error: 'Task title is required' },
        { status: 400 },
      );
    }

    // If assigneeId is provided, verify they are in this team
    if (assigneeId) {
      const isAssigneeMember = await isUserTeamMember(teamId, assigneeId);
      if (!isAssigneeMember) {
        return NextResponse.json(
          { error: 'Assignee must be a member of this team' },
          { status: 400 },
        );
      }
    }

    const newTask = await prisma.task.create({
      data: {
        title: title.trim(),
        description: description?.trim() || null,
        status: status || 'TODO',
        priority: priority || 'MEDIUM',
        dueDate: dueDate ? new Date(dueDate) : null,
        teamId,
        assigneeId: assigneeId || null,
        creatorId: authUser.id,
      },
      include: {
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
    console.error('Error creating team task:', error);
    return NextResponse.json(
      { error: 'Failed to create task', details: (error as Error).message },
      { status: 500 },
    );
  }
}
