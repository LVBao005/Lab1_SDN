import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';

// Helper to check team membership
async function isUserTeamMember(teamId: string, userId: string) {
  const team = await prisma.team.findUnique({
    where: { id: teamId },
    include: {
      members: {
        where: { userId },
      },
    },
  });

  if (!team) return { isMember: false, team: null, role: null };
  const isOwner = team.ownerId === userId;
  const member = team.members[0];
  const isMember = isOwner || Boolean(member);
  const role = isOwner ? 'OWNER' : member ? member.role : null;

  return { isMember, team, role };
}

// GET /api/teams/:id/messages - Get team chat message history
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser) {
      return NextResponse.json(
        { error: 'Unauthorized. Please login to view messages.' },
        { status: 401 },
      );
    }

    const { id: teamId } = await context.params;
    const { isMember } = await isUserTeamMember(teamId, authUser.id);

    if (!isMember) {
      return NextResponse.json(
        { error: 'Forbidden. You are not a member of this team.' },
        { status: 403 },
      );
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    const messages = await prisma.message.findMany({
      where: { teamId },
      orderBy: { createdAt: 'asc' },
      take: limit,
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json(messages, { status: 200 });
  } catch (error) {
    console.error('Error fetching team messages:', error);
    return NextResponse.json(
      { error: 'Failed to fetch messages', details: (error as Error).message },
      { status: 500 },
    );
  }
}

// POST /api/teams/:id/messages - Send a new message to team chat
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser) {
      return NextResponse.json(
        { error: 'Unauthorized. Please login to send messages.' },
        { status: 401 },
      );
    }

    const { id: teamId } = await context.params;
    const { isMember } = await isUserTeamMember(teamId, authUser.id);

    if (!isMember) {
      return NextResponse.json(
        { error: 'Forbidden. You are not a member of this team.' },
        { status: 403 },
      );
    }

    const body = await request.json();
    const { content } = body;

    if (!content || typeof content !== 'string' || content.trim() === '') {
      return NextResponse.json(
        { error: 'Message content cannot be empty' },
        { status: 400 },
      );
    }

    const message = await prisma.message.create({
      data: {
        content: content.trim(),
        teamId,
        senderId: authUser.id,
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json(message, { status: 201 });
  } catch (error) {
    console.error('Error sending team message:', error);
    return NextResponse.json(
      { error: 'Failed to send message', details: (error as Error).message },
      { status: 500 },
    );
  }
}
