import { NextResponse } from 'next/server';
import { getUserFromCookie } from '@/lib/auth';
import db from '@/lib/db';

export const dynamic = 'force-dynamic';

// GET /api/profile - Get user profile
export async function GET() {
  const user = await getUserFromCookie();
  if (!user) return NextResponse.json({ error: '未登录' }, { status: 401 });

  const profile = db
    .prepare('SELECT * FROM profiles WHERE user_id = ?')
    .get(user.id) as any;

  return NextResponse.json({ profile });
}

// PUT /api/profile - Update user profile
export async function PUT(request: Request) {
  const user = await getUserFromCookie();
  if (!user) return NextResponse.json({ error: '未登录' }, { status: 401 });

  const updates = await request.json();
  const allowed = ['age', 'height', 'weight', 'gender', 'activity', 'goal'];
  const fields: string[] = [];
  const values: any[] = [];

  for (const [key, value] of Object.entries(updates)) {
    if (allowed.includes(key)) {
      fields.push(`${key} = ?`);
      values.push(value);
    }
  }

  if (fields.length === 0) {
    return NextResponse.json({ error: '无有效字段' }, { status: 400 });
  }

  fields.push("updated_at = datetime('now')");
  values.push(user.id);

  // Check if profile exists, create if not
  const existing = db.prepare('SELECT id FROM profiles WHERE user_id = ?').get(user.id);
  if (existing) {
    db.prepare(`UPDATE profiles SET ${fields.join(', ')} WHERE user_id = ?`).run(...values);
  } else {
    const { randomUUID } = require('crypto');
    const cols = ['id', 'user_id', ...fields.map((f: string) => f.split(' =')[0])];
    const placeholders = cols.map(() => '?').join(', ');
    const { randomUUID: uuid } = require('crypto');
    db.prepare(`INSERT INTO profiles (${cols.join(', ')}) VALUES (${placeholders})`).run(
      randomUUID(),
      user.id,
      ...values.slice(0, -1)
    );
  }

  const profile = db.prepare('SELECT * FROM profiles WHERE user_id = ?').get(user.id);
  return NextResponse.json({ profile });
}
