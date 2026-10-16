import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';
import { createNotification } from '@/lib/notifications';

// PATCH /api/teams/:id/members/:userId - Update member role (Owner or Admin)
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string; userId: string }> },
) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser) {
      return NextResponse.json(
        { error: 'Unauthorized. Please login to update member roles.' },
        { status: 401 },
      );
    }

    const { id: teamId, userId: targetUserId } = await context.params;
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: {
        members: {
          where: { userId: authUser.id },
        },
      },
    });

    if (!team) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 });
    }

    const isOwner = team.ownerId === authUser.id;
    const callerMembership = team.members[0];
    const isAdmin = callerMembership?.role === 'ADMIN';

    // Must be Owner or Admin
    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        { error: 'Forbidden. Only team Owner or Admin can change member roles.' },
        { status: 403 },
      );
    }

    // Cannot change role of the owner
    if (team.ownerId === targetUserId) {
      return NextResponse.json(
        { error: 'Cannot change the role of the team Owner.' },
        { status: 400 },
      );
    }

    const targetMembership = await prisma.teamMember.findUnique({
      where: {
        teamId_userId: {
          teamId,
          userId: targetUserId,
        },
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });

    if (!targetMembership) {
      return NextResponse.json(
        { error: 'User is not a member of this team.' },
        { status: 404 },
      );
    }

    // Admin cannot demote another Admin or promote to Owner
    if (isAdmin && !isOwner) {
      if (targetMembership.role === 'ADMIN') {
        return NextResponse.json(
          { error: 'Forbidden. Admins cannot change roles of other Admins.' },
          { status: 403 },
        );
      }
    }

    const body = await request.json();
    const { role } = body;

    if (!role || (role !== 'ADMIN' && role !== 'MEMBER')) {
      return NextResponse.json(
        { error: 'Invalid role. Must be either "ADMIN" or "MEMBER".' },
        { status: 400 },
      );
    }

    const updatedMembership = await prisma.teamMember.update({
      where: {
        teamId_userId: {
          teamId,
          userId: targetUserId,
        },
      },
      data: { role },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });

    // Send in-app notification to the affected member
    await createNotification({
      userId: targetUserId,
      title: 'Vai trò trong nhóm đã thay đổi',
      content: `Vai trò của bạn trong nhóm "${team.name}" đã được cập nhật thành ${role}.`,
      type: 'ROLE_UPDATED',
      link: `/teams/${teamId}`,
    });

    return NextResponse.json(updatedMembership, { status: 200 });
  } catch (error) {
    console.error('Error updating member role:', error);
    return NextResponse.json(
      { error: 'Failed to update member role', details: (error as Error).message },
      { status: 500 },
    );
  }
}

// DELETE /api/teams/:id/members/:userId - Remove a member from a team (Owner or Admin)
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string; userId: string }> },
) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser) {
      return NextResponse.json(
        { error: 'Unauthorized. Please login to remove members.' },
        { status: 401 },
      );
    }

    const { id: teamId, userId: targetUserId } = await context.params;
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: {
        members: {
          where: { userId: authUser.id },
        },
      },
    });

    if (!team) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 });
    }

    const isOwner = team.ownerId === authUser.id;
    const callerMembership = team.members[0];
    const isAdmin = callerMembership?.role === 'ADMIN';

    // Must be Owner or Admin
    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        { error: 'Forbidden. Only team Owner or Admin can remove members.' },
        { status: 403 },
      );
    }

    // Cannot remove the owner
    if (team.ownerId === targetUserId) {
      return NextResponse.json(
        { error: 'Cannot remove the Owner from the team.' },
        { status: 400 },
      );
    }

    // Check if target membership exists
    const targetMembership = await prisma.teamMember.findUnique({
      where: {
        teamId_userId: {
          teamId,
          userId: targetUserId,
        },
      },
    });

    if (!targetMembership) {
      return NextResponse.json(
        { error: 'User is not a member of this team' },
        { status: 404 },
      );
    }

    // Admin cannot remove another Admin (only Owner can)
    if (isAdmin && !isOwner && targetMembership.role === 'ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden. Admins cannot remove other Admins. Only Owner can.' },
        { status: 403 },
      );
    }

    // Remove member and unassign any tasks in this team
    await prisma.$transaction([
      prisma.teamMember.delete({
        where: {
          teamId_userId: {
            teamId,
            userId: targetUserId,
          },
        },
      }),
      prisma.task.updateMany({
        where: {
          teamId,
          assigneeId: targetUserId,
        },
        data: {
          assigneeId: null,
        },
      }),
    ]);

    return NextResponse.json(
      { message: 'Member removed successfully' },
      { status: 200 },
    );
  } catch (error) {
    console.error('Error removing team member:', error);
    return NextResponse.json(
      { error: 'Failed to remove member', details: (error as Error).message },
      { status: 500 },
    );
  }
}
