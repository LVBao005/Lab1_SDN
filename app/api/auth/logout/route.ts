import { NextResponse } from 'next/server';
import { clearAuthCookie } from '@/lib/auth';

// POST /api/auth/logout - Logout user and clear session
export async function POST() {
  const response = NextResponse.json(
    { message: 'Logged out successfully' },
    { status: 200 },
  );
  clearAuthCookie(response);
  return response;
}
