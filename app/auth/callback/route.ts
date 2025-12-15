// app/auth/callback/route.ts
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');

  if (code) {
    // 使用环境变量创建 Supabase 客户端
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    
    // 使用一次性 code 换取 session
    await supabase.auth.exchangeCodeForSession(code);
  }

  // 验证完成后，重定向回首页
  return NextResponse.redirect(requestUrl.origin);
}