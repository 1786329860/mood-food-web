import { NextResponse } from 'next/server';
import { getUserFromCookie } from '@/lib/auth';
import db from '@/lib/db';
import { randomUUID } from 'crypto';

export const dynamic = 'force-dynamic';

// GET /api/inventory - Get user's inventory
export async function GET() {
  const user = await getUserFromCookie();
  if (!user) return NextResponse.json({ error: '未登录' }, { status: 401 });

  const items = db
    .prepare('SELECT * FROM inventory WHERE user_id = ? ORDER BY created_at DESC')
    .all(user.id);

  return NextResponse.json({ items });
}

// POST /api/inventory - Add item to inventory
export async function POST(request: Request) {
  const user = await getUserFromCookie();
  if (!user) return NextResponse.json({ error: '未登录' }, { status: 401 });

  const { name, quantity } = await request.json();
  if (!name?.trim()) {
    return NextResponse.json({ error: '请输入食材名称' }, { status: 400 });
  }

  const id = randomUUID();
  db.prepare('INSERT INTO inventory (id, user_id, name, quantity) VALUES (?, ?, ?, ?)').run(
    id,
    user.id,
    name.trim(),
    quantity?.trim() || '1'
  );

  const item = db.prepare('SELECT * FROM inventory WHERE id = ?').get(id);
  return NextResponse.json({ item });
}

// DELETE /api/inventory - Remove item from inventory
export async function DELETE(request: Request) {
  const user = await getUserFromCookie();
  if (!user) return NextResponse.json({ error: '未登录' }, { status: 401 });

  const { id } = await request.json();
  db.prepare('DELETE FROM inventory WHERE id = ? AND user_id = ?').run(id, user.id);

  return NextResponse.json({ success: true });
}
