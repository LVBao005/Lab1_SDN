import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';

// POST /api/teams/:id/members - Add a member to a team by email (Owner only)
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
    });

    if (!team) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 });
    }

    // Only owner can add members
    if (team.ownerId !== authUser.id) {
      return NextResponse.json(
        { error: 'Forbidden. Only the team Owner can add new members.' },
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

    const memberRole = role === 'OWNER' ? 'OWNER' : 'MEMBER';

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

    return NextResponse.json(newMember, { status: 201 });
  } catch (error) {
    console.error('Error adding team member:', error);
    return NextResponse.json(
      { error: 'Failed to add member', details: (error as Error).message },
      { status: 500 },
    );
  }
}
