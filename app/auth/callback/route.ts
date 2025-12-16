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
    
    try {
      // 关键步骤：使用一次性 Code 换取用户的 Session
      // 这会自动在浏览器中设置 cookie，保持用户登录状态
      await supabase.auth.exchangeCodeForSession(code);
    } catch (error) {
      console.error('Session exchange failed:', error);
      // 如果出错，重定向回登录页并带上错误信息
      return NextResponse.redirect(`${requestUrl.origin}/auth/signin?error=CallbackFailed`);
    }
  }

  // 验证成功后，重定向回首页
  // requestUrl.origin 会自动适配 localhost 或 vercel 域名
  return NextResponse.redirect(requestUrl.origin);
}