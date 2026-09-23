import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({
      connected: true,
      provider: 'PostgreSQL (Supabase) + Prisma ORM',
      hasConfiguredPassword: true,
      message: 'Đã kết nối PostgreSQL Supabase qua Prisma',
      activeStore: 'Prisma (Supabase)',
    });
  } catch (error) {
    return NextResponse.json(
      {
        connected: false,
        provider: 'PostgreSQL (Supabase)',
        message: 'Lỗi kết nối cơ sở dữ liệu: ' + (error as Error).message,
      },
      { status: 500 },
    );
  }
}
