import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { hashPassword, signJWT, setAuthCookie } from '@/lib/auth';

// POST /api/auth/register - Register a new user
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, password } = body;

    // Validate inputs
    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json(
        { error: 'Valid email address is required' },
        { status: 400 },
      );
    }

    if (!password || typeof password !== 'string' || password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long' },
        { status: 400 },
      );
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Check if email already registered
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'An account with this email already exists' },
        { status: 409 },
      );
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user
    const newUser = await prisma.user.create({
      data: {
        name: name?.trim() || null,
        email: normalizedEmail,
        password: hashedPassword,
      },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
      },
    });

    // Generate JWT token
    const token = await signJWT({
      id: newUser.id,
      email: newUser.email,
      name: newUser.name,
    });

    const response = NextResponse.json(
      {
        message: 'Registration successful',
        user: newUser,
        token,
      },
      { status: 201 },
    );

    // Set cookie
    setAuthCookie(response, token);
    return response;
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Internal server error during registration', details: (error as Error).message },
      { status: 500 },
    );
  }
}
