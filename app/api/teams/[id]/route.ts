import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';

// Helper to check if user has access to team
async function checkTeamAccess(teamId: string, userId: string) {
  const team = await prisma.team.findUnique({
    where: { id: teamId },
    include: {
      members: {
        where: { userId },
      },
    },
  });

  if (!team) return { team: null, isMember: false, isOwner: false };
  const isOwner = team.ownerId === userId;
  const isMember = isOwner || team.members.length > 0;
  return { team, isMember, isOwner };
}

// GET /api/teams/:id - Get team details, including members and tasks
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized. Please login to view team.' },
        { status: 401 },
      );
    }

    const { id } = await context.params;
    const { team, isMember } = await checkTeamAccess(id, user.id);

    if (!team) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 });
    }

    if (!isMember) {
      return NextResponse.json(
        { error: 'Forbidden. You are not a member of this team.' },
        { status: 403 },
      );
    }

    const teamDetails = await prisma.team.findUnique({
      where: { id },
      include: {
        owner: {
          select: { id: true, name: true, email: true },
        },
        members: {
          include: {
            user: {
              select: { id: true, name: true, email: true },
            },
          },
          orderBy: { joinedAt: 'asc' },
        },
        tasks: {
          include: {
            assignee: {
              select: { id: true, name: true, email: true },
            },
            creator: {
              select: { id: true, name: true, email: true },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    return NextResponse.json(teamDetails, { status: 200 });
  } catch (error) {
    console.error('Error fetching team details:', error);
    return NextResponse.json(
      { error: 'Failed to fetch team details', details: (error as Error).message },
      { status: 500 },
    );
  }
}

// PUT /api/teams/:id - Update team info (Owner only)
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized. Please login to update team.' },
        { status: 401 },
      );
    }

    const { id } = await context.params;
    const { team, isOwner } = await checkTeamAccess(id, user.id);

    if (!team) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 });
    }

    if (!isOwner) {
      return NextResponse.json(
        { error: 'Forbidden. Only the team Owner can update team details.' },
        { status: 403 },
      );
    }

    const body = await request.json();
    const { name, description } = body;

    if (name !== undefined && (typeof name !== 'string' || name.trim() === '')) {
      return NextResponse.json(
        { error: 'Team name cannot be empty' },
        { status: 400 },
      );
    }

    const updatedTeam = await prisma.team.update({
      where: { id },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(description !== undefined && { description: description?.trim() || null }),
      },
      include: {
        owner: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    return NextResponse.json(updatedTeam, { status: 200 });
  } catch (error) {
    console.error('Error updating team:', error);
    return NextResponse.json(
      { error: 'Failed to update team', details: (error as Error).message },
      { status: 500 },
    );
  }
}

// DELETE /api/teams/:id - Delete a team (Owner only)
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized. Please login to delete team.' },
        { status: 401 },
      );
    }

    const { id } = await context.params;
    const { team, isOwner } = await checkTeamAccess(id, user.id);

    if (!team) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 });
    }

    if (!isOwner) {
      return NextResponse.json(
        { error: 'Forbidden. Only the team Owner can delete this team.' },
        { status: 403 },
      );
    }

    await prisma.team.delete({
      where: { id },
    });

    return NextResponse.json(
      { message: 'Team and all associated data deleted successfully' },
      { status: 200 },
    );
  } catch (error) {
    console.error('Error deleting team:', error);
    return NextResponse.json(
      { error: 'Failed to delete team', details: (error as Error).message },
      { status: 500 },
    );
  }
}
