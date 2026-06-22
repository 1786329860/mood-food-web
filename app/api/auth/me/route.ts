import { NextResponse } from 'next/server';
import { getUserFromCookie } from '@/lib/auth';
import db from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  const user = await getUserFromCookie();
  if (!user) {
    return NextResponse.json({ user: null });
  }

  // Fetch full user info from DB
  const dbUser = db
    .prepare('SELECT id, email, username, created_at FROM users WHERE id = ?')
    .get(user.id) as any;

  if (!dbUser) {
    return NextResponse.json({ user: null });
  }

  return NextResponse.json({ user: dbUser });
}
