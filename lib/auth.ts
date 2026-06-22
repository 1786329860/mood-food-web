import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import crypto from 'crypto';

const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || crypto.randomBytes(32).toString('hex')
);
const COOKIE_NAME = 'moodfood_token';

export interface UserPayload {
  id: string;
  email: string;
}

/**
 * Create a signed JWT token
 */
export async function createToken(user: UserPayload): Promise<string> {
  return new SignJWT({ id: user.id, email: user.email })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('7d')
    .setIssuedAt()
    .sign(SECRET);
}

/**
 * Verify and decode a JWT token
 */
export async function verifyToken(token: string): Promise<UserPayload | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET);
    return { id: payload.id as string, email: payload.email as string };
  } catch {
    return null;
  }
}

/**
 * Get the current user from the auth cookie
 */
export async function getUserFromCookie(): Promise<UserPayload | null> {
  const cookieStore = cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyToken(token);
}

/**
 * Set the auth cookie
 */
export function getAuthCookieOptions(token: string, maxAge = 7 * 24 * 3600) {
  return {
    name: COOKIE_NAME,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge,
  };
}

export { COOKIE_NAME };
