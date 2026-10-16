import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';
import { createNotification } from '@/lib/notifications';

// PUT /api/tasks/[id] - Update task information with RBAC
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser) {
      return NextResponse.json(
        { error: 'Unauthorized. Please login to update tasks.' },
        { status: 401 },
      );
    }

    const { id } = await context.params;

    const existing = await prisma.task.findUnique({
      where: { id },
      include: {
        team: {
          include: {
            members: {
              where: { userId: authUser.id },
            },
          },
        },
      },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    // Role-based authorization:
    // Owner & Admin: can update all tasks in team
    // Member: can create and manage their own tasks (creator or assignee)
    if (existing.teamId && existing.team) {
      const isOwner = existing.team.ownerId === authUser.id;
      const callerMembership = existing.team.members[0];
      const isAdmin = callerMembership?.role === 'ADMIN';
      const isCreator = existing.creatorId === authUser.id;
      const isAssignee = existing.assigneeId === authUser.id;

      const isTeamMember = isOwner || Boolean(callerMembership);
      if (!isTeamMember) {
        return NextResponse.json(
          { error: 'Forbidden. You are not a member of the team.' },
          { status: 403 },
        );
      }

      if (!isOwner && !isAdmin && !isCreator && !isAssignee) {
        return NextResponse.json(
          {
            error:
              'Forbidden. Members can only update their own tasks (assigned or created by them).',
          },
          { status: 403 },
        );
      }
    }

    const body = await request.json();
    const { title, description, status, priority, dueDate, assigneeId } = body;

    const updatedTask = await prisma.task.update({
      where: { id },
      data: {
        ...(title !== undefined && { title: title.trim() }),
        ...(description !== undefined && { description: description?.trim() || null }),
        ...(status !== undefined && { status }),
        ...(priority !== undefined && { priority }),
        ...(dueDate !== undefined && { dueDate: dueDate ? new Date(dueDate) : null }),
        ...(assigneeId !== undefined && { assigneeId: assigneeId || null }),
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

    // Notify new assignee if changed
    if (
      assigneeId !== undefined &&
      assigneeId &&
      assigneeId !== existing.assigneeId &&
      assigneeId !== authUser.id
    ) {
      await createNotification({
        userId: assigneeId,
        title: 'Bạn được giao một công việc mới',
        content: `Bạn được giao công việc "${updatedTask.title}".`,
        type: 'TASK_ASSIGNED',
        link: existing.teamId ? `/teams/${existing.teamId}` : undefined,
      });
    }

    return NextResponse.json(updatedTask, { status: 200 });
  } catch (error) {
    console.error('Error updating task:', error);
    return NextResponse.json(
      { error: 'Failed to update task', details: (error as Error).message },
      { status: 500 },
    );
  }
}

// DELETE /api/tasks/[id] - Delete a task (Owner, Admin, or Creator)
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser) {
      return NextResponse.json(
        { error: 'Unauthorized. Please login to delete tasks.' },
        { status: 401 },
      );
    }

    const { id } = await context.params;

    const existing = await prisma.task.findUnique({
      where: { id },
      include: {
        team: {
          include: {
            members: {
              where: { userId: authUser.id },
            },
          },
        },
      },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    // Role-based authorization:
    // Owner: full control - can delete any task
    // Admin: can manage all tasks - can delete any task
    // Member: can manage their own tasks - can delete tasks they created
    const isTeamOwner = existing.team?.ownerId === authUser.id;
    const callerMembership = existing.team?.members[0];
    const isTeamAdmin = callerMembership?.role === 'ADMIN';
    const isCreator = existing.creatorId === authUser.id;

    if (!isTeamOwner && !isTeamAdmin && !isCreator) {
      return NextResponse.json(
        {
          error:
            'Forbidden. Only the task creator, team Admin, or team Owner can delete this task.',
        },
        { status: 403 },
      );
    }

    await prisma.task.delete({
      where: { id },
    });

    return NextResponse.json(
      { message: 'Task deleted successfully' },
      { status: 200 },
    );
  } catch (error) {
    console.error('Error deleting task:', error);
    return NextResponse.json(
      { error: 'Failed to delete task', details: (error as Error).message },
      { status: 500 },
    );
  }
}
