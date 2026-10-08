import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';

// DELETE /api/teams/:id/members/:userId - Remove a member from a team (Owner only)
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
    });

    if (!team) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 });
    }

    // Only owner can remove members
    if (team.ownerId !== authUser.id) {
      return NextResponse.json(
        { error: 'Forbidden. Only the team Owner can remove members.' },
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

    // Check if membership exists
    const membership = await prisma.teamMember.findUnique({
      where: {
        teamId_userId: {
          teamId,
          userId: targetUserId,
        },
      },
    });

    if (!membership) {
      return NextResponse.json(
        { error: 'User is not a member of this team' },
        { status: 404 },
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
