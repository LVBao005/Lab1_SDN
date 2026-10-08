import { SignJWT, jwtVerify } from 'jose';
import bcrypt from 'bcryptjs';
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const AUTH_COOKIE_NAME = 'auth_token';

const JWT_SECRET_STRING =
  process.env.JWT_SECRET || 'lab2-sdn-assignment2-super-secret-jwt-key-32chars';
const JWT_SECRET = new TextEncoder().encode(JWT_SECRET_STRING);

export interface TokenPayload {
  id: string;
  email: string;
  name?: string | null;
  [key: string]: any;
}

// Hash password with bcrypt
export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

// Compare password with hash
export async function comparePassword(
  plain: string,
  hashed: string,
): Promise<boolean> {
  return bcrypt.compare(plain, hashed);
}

// Sign JWT token valid for 7 days
export async function signJWT(payload: TokenPayload): Promise<string> {
  return new SignJWT({
    id: payload.id,
    email: payload.email,
    name: payload.name,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(JWT_SECRET);
}

// Verify JWT token
export async function verifyJWT(token: string): Promise<TokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as unknown as TokenPayload;
  } catch {
    return null;
  }
}

// Extract authenticated user from request (either HTTP cookie or Authorization header)
export async function getAuthUser(request: NextRequest) {
  // 1. Check HTTP-only cookie
  let token = request.cookies.get(AUTH_COOKIE_NAME)?.value;

  // 2. Check Authorization Bearer header if cookie is missing
  if (!token) {
    const authHeader = request.headers.get('authorization');
    if (authHeader && authHeader.toLowerCase().startsWith('bearer ')) {
      token = authHeader.substring(7).trim();
    }
  }

  if (!token) {
    return null;
  }

  const payload = await verifyJWT(token);
  if (!payload || !payload.id) {
    return null;
  }

  // Verify that the user exists in database
  const user = await prisma.user.findUnique({
    where: { id: payload.id },
    select: {
      id: true,
      name: true,
      email: true,
      createdAt: true,
    },
  });

  return user;
}

// Set auth cookie on NextResponse
export function setAuthCookie(response: NextResponse, token: string) {
  response.cookies.set({
    name: AUTH_COOKIE_NAME,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
  return response;
}

// Clear auth cookie on NextResponse
export function clearAuthCookie(response: NextResponse) {
  response.cookies.set({
    name: AUTH_COOKIE_NAME,
    value: '',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
  return response;
}
