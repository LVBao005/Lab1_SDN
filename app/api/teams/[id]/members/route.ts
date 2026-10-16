import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';
import { createNotification } from '@/lib/notifications';

// POST /api/teams/:id/members - Add a member to a team by email (Owner or Admin)
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser) {
      return NextResponse.json(
        { error: 'Unauthorized. Please login to add members.' },
        { status: 401 },
      );
    }

    const { id: teamId } = await context.params;
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

    // Only owner or admin can add members
    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        { error: 'Forbidden. Only team Owner or Admin can add new members.' },
        { status: 403 },
      );
    }

    const body = await request.json();
    const { email, role } = body;

    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { error: 'User email is required' },
        { status: 400 },
      );
    }

    const targetUser = await prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
    });

    if (!targetUser) {
      return NextResponse.json(
        { error: `User with email "${email}" was not found. Please ask them to register first.` },
        { status: 404 },
      );
    }

    // Check if already in the team
    const existingMember = await prisma.teamMember.findUnique({
      where: {
        teamId_userId: {
          teamId,
          userId: targetUser.id,
        },
      },
    });

    if (existingMember) {
      return NextResponse.json(
        { error: 'This user is already a member of the team' },
        { status: 409 },
      );
    }

    const memberRole = role === 'ADMIN' ? 'ADMIN' : 'MEMBER';

    const newMember = await prisma.teamMember.create({
      data: {
        teamId,
        userId: targetUser.id,
        role: memberRole,
      },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    // Send in-app notification to the newly added member
    await createNotification({
      userId: targetUser.id,
      title: 'Được thêm vào nhóm mới',
      content: `Bạn đã được thêm vào nhóm "${team.name}" với vai trò ${memberRole}.`,
      type: 'TEAM_INVITED',
      link: `/teams/${teamId}`,
    });

    return NextResponse.json(newMember, { status: 201 });
  } catch (error) {
    console.error('Error adding team member:', error);
    return NextResponse.json(
      { error: 'Failed to add member', details: (error as Error).message },
      { status: 500 },
    );
  }
}

