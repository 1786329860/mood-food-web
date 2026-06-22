import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';
import db from '@/lib/db';
import { createToken, getAuthCookieOptions } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const { email, password, code } = await request.json();

    if (!email || !password || !code) {
      return NextResponse.json({ error: '请填写完整信息' }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: '密码至少 6 个字符' }, { status: 400 });
    }

    // Check email not taken
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (existing) {
      return NextResponse.json({ error: '该邮箱已注册' }, { status: 409 });
    }

    // Verify code
    const record = db
      .prepare(
        "SELECT * FROM verification_codes WHERE email = ? AND code = ? AND used = 0 AND expires_at > datetime('now') ORDER BY created_at DESC LIMIT 1"
      )
      .get(email, code) as any;

    if (!record) {
      return NextResponse.json({ error: '验证码无效或已过期' }, { status: 400 });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user
    const userId = randomUUID();
    db.prepare('INSERT INTO users (id, email, password_hash) VALUES (?, ?, ?)').run(
      userId,
      email,
      passwordHash
    );

    // Create default profile
    db.prepare('INSERT INTO profiles (id, user_id) VALUES (?, ?)').run(randomUUID(), userId);

    // Mark code as used
    db.prepare('UPDATE verification_codes SET used = 1 WHERE id = ?').run(record.id);

    // Clean up expired codes
    db.prepare("DELETE FROM verification_codes WHERE expires_at < datetime('now') AND used = 0").run();

    // Create JWT and set cookie
    const token = await createToken({ id: userId, email });
    const response = NextResponse.json({
      user: { id: userId, email },
    });
    response.cookies.set(getAuthCookieOptions(token));

    return response;
  } catch (error: any) {
    console.error('Register error:', error);
    return NextResponse.json({ error: '注册失败，请稍后重试' }, { status: 500 });
  }
}
