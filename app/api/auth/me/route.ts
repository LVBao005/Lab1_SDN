import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';

// GET /api/auth/me - Get current logged-in user profile
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request);

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized. Please login to continue.' },
        { status: 401 },
      );
    }

    return NextResponse.json({ user }, { status: 200 });
  } catch (error) {
    console.error('Auth check error:', error);
    return NextResponse.json(
      { error: 'Failed to verify session' },
      { status: 500 },
    );
  }
}
