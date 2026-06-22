import { NextResponse } from 'next/server';
import { COOKIE_NAME, getAuthCookieOptions } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST() {
  const response = NextResponse.json({ success: true });
  response.cookies.set(getAuthCookieOptions('', 0)); // Expire immediately
  return response;
}
