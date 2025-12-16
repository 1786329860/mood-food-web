// app/auth/callback/route.ts
import { NextResponse } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/';
  
  // 1. 处理错误情况 (如 OTP 过期)
  const error = searchParams.get('error');
  if (error) {
    console.error('Auth Error:', searchParams.get('error_description'));
    // 重定向回登录页并显示错误
    return NextResponse.redirect(`${origin}/auth/signin?error=${error}`);
  }

  if (code) {
    const cookieStore = cookies();

    // 2. 初始化服务端客户端 (自动处理 Cookie)
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
          set(name: string, value: string, options: CookieOptions) {
            cookieStore.set({ name, value, ...options });
          },
          remove(name: string, options: CookieOptions) {
            cookieStore.delete({ name, ...options });
          },
        },
      }
    );

    // 3. 交换 Token (自动写入 Cookie)
    const { error: sessionError } = await supabase.auth.exchangeCodeForSession(code);
    
    if (!sessionError) {
      // 登录成功，重定向回首页
      return NextResponse.redirect(`${origin}${next}`);
    } else {
      console.error('Session exchange failed:', sessionError);
      return NextResponse.redirect(`${origin}/auth/signin?error=SessionExchangeFailed`);
    }
  }

  // 无 code 也无 error，异常访问，回首页
  return NextResponse.redirect(`${origin}/auth/signin`);
}