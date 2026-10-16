import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';

// GET /api/notifications - Get current user notifications
export async function GET(request: NextRequest) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser) {
      return NextResponse.json(
        { error: 'Unauthorized. Please login to view notifications.' },
        { status: 401 },
      );
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20', 10);

    const [notifications, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where: { userId: authUser.id },
        orderBy: { createdAt: 'desc' },
        take: limit,
      }),
      prisma.notification.count({
        where: { userId: authUser.id, isRead: false },
      }),
    ]);

    return NextResponse.json({
      notifications,
      unreadCount,
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notifications', details: (error as Error).message },
      { status: 500 },
    );
  }
}

// PATCH /api/notifications - Mark notifications as read
export async function PATCH(request: NextRequest) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser) {
      return NextResponse.json(
        { error: 'Unauthorized. Please login to update notifications.' },
        { status: 401 },
      );
    }

    const body = await request.json();
    const { id, all } = body;

    if (all) {
      await prisma.notification.updateMany({
        where: { userId: authUser.id, isRead: false },
        data: { isRead: true },
      });
      return NextResponse.json({ message: 'All notifications marked as read' });
    }

    if (id) {
      const existing = await prisma.notification.findUnique({
        where: { id },
      });

      if (!existing || existing.userId !== authUser.id) {
        return NextResponse.json(
          { error: 'Notification not found' },
          { status: 404 },
        );
      }

      const updated = await prisma.notification.update({
        where: { id },
        data: { isRead: true },
      });

      return NextResponse.json(updated);
    }

    return NextResponse.json(
      { error: 'Either notification id or "all: true" is required' },
      { status: 400 },
    );
  } catch (error) {
    console.error('Error marking notifications as read:', error);
    return NextResponse.json(
      { error: 'Failed to update notifications', details: (error as Error).message },
      { status: 500 },
    );
  }
}

// DELETE /api/notifications - Delete notification or clear read
export async function DELETE(request: NextRequest) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser) {
      return NextResponse.json(
        { error: 'Unauthorized. Please login to delete notifications.' },
        { status: 401 },
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (id) {
      const existing = await prisma.notification.findUnique({
        where: { id },
      });

      if (!existing || existing.userId !== authUser.id) {
        return NextResponse.json(
          { error: 'Notification not found' },
          { status: 404 },
        );
      }

      await prisma.notification.delete({ where: { id } });
      return NextResponse.json({ message: 'Notification deleted' });
    }

    // Default: Clear read notifications
    await prisma.notification.deleteMany({
      where: { userId: authUser.id, isRead: true },
    });

    return NextResponse.json({ message: 'Read notifications cleared' });
  } catch (error) {
    console.error('Error deleting notifications:', error);
    return NextResponse.json(
      { error: 'Failed to delete notifications', details: (error as Error).message },
      { status: 500 },
    );
  }
}
