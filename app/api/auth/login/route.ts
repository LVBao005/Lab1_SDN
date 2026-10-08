import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { comparePassword, signJWT, setAuthCookie } from '@/lib/auth';

// POST /api/auth/login - Login and receive a session/token
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 },
      );
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 },
      );
    }

    // Check password
    const isPasswordValid = await comparePassword(password, user.password);
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 },
      );
    }

    // Generate JWT
    const token = await signJWT({
      id: user.id,
      email: user.email,
      name: user.name,
    });

    const userProfile = {
      id: user.id,
      name: user.name,
      email: user.email,
      createdAt: user.createdAt,
    };

    const response = NextResponse.json(
      {
        message: 'Login successful',
        user: userProfile,
        token,
      },
      { status: 200 },
    );

    // Set HTTP-only cookie
    setAuthCookie(response, token);
    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error during login', details: (error as Error).message },
      { status: 500 },
    );
  }
}
