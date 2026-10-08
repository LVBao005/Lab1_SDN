import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';

// GET /api/teams - List teams the current user belongs to
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized. Please login to view teams.' },
        { status: 401 },
      );
    }

    const teams = await prisma.team.findMany({
      where: {
        OR: [
          { ownerId: user.id },
          { members: { some: { userId: user.id } } },
        ],
      },
      include: {
        owner: {
          select: { id: true, name: true, email: true },
        },
        members: {
          where: { userId: user.id },
          select: { role: true },
        },
        _count: {
          select: { members: true, tasks: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(teams, { status: 200 });
  } catch (error) {
    console.error('Error fetching teams:', error);
    return NextResponse.json(
      { error: 'Failed to fetch teams', details: (error as Error).message },
      { status: 500 },
    );
  }
}

// POST /api/teams - Create a new team (creator automatically becomes Owner)
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized. Please login to create a team.' },
        { status: 401 },
      );
    }

    const body = await request.json();
    const { name, description } = body;

    if (!name || typeof name !== 'string' || name.trim() === '') {
      return NextResponse.json(
        { error: 'Team name is required' },
        { status: 400 },
      );
    }

    // Create team and assign owner as TeamMember with OWNER role
    const newTeam = await prisma.$transaction(async (tx) => {
      const team = await tx.team.create({
        data: {
          name: name.trim(),
          description: description?.trim() || null,
          ownerId: user.id,
        },
      });

      await tx.teamMember.create({
        data: {
          teamId: team.id,
          userId: user.id,
          role: 'OWNER',
        },
      });

      return team;
    });

    // Fetch team with relations
    const completeTeam = await prisma.team.findUnique({
      where: { id: newTeam.id },
      include: {
        owner: {
          select: { id: true, name: true, email: true },
        },
        _count: {
          select: { members: true, tasks: true },
        },
      },
    });

    return NextResponse.json(completeTeam, { status: 201 });
  } catch (error) {
    console.error('Error creating team:', error);
    return NextResponse.json(
      { error: 'Failed to create team', details: (error as Error).message },
      { status: 500 },
    );
  }
}
