import prisma from '@/lib/prisma';
import { NotificationType } from '@/types';

interface CreateNotificationParams {
  userId: string;
  title: string;
  content: string;
  type: NotificationType;
  link?: string;
}

export async function createNotification({
  userId,
  title,
  content,
  type,
  link,
}: CreateNotificationParams) {
  try {
    const notification = await prisma.notification.create({
      data: {
        userId,
        title,
        content,
        type,
        link,
      },
    });
    return notification;
  } catch (error) {
    console.error('Failed to create in-app notification:', error);
    return null;
  }
}
