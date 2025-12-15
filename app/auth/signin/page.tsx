'use client';

import { useState } from 'react';
import { supabase } from '../../../utils/supabase'; // 确保路径正确，如果不报错就保持原样

const SignInPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState(''); // 新增：成功提示
  const [isLoading, setIsLoading] = useState(false);
  
  // 新增：控制当前是“登录”还是“注册”模式
  const [isSignUp, setIsSignUp] = useState(false);

  // 获取登录后的回调地址
  const getCallbackUrl = () => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      return urlParams.get('callbackUrl') || '/';
    }
    return '/';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setIsLoading(true);

    try {
      const currentCallbackUrl = getCallbackUrl();
      
      if (isSignUp) {
        // --- 注册逻辑 ---
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`, // 注册后的验证跳转
          }
        });

        if (error) {
          setError(error.message);
        } else {
          // Supabase 默认行为：如果需要验证邮箱，data.session 为 null
          if (data.user && !data.session) {
            setSuccessMsg('注册成功！请前往您的邮箱查收验证邮件。');
          } else {
            setSuccessMsg('注册并登录成功！正在跳转...');
            window.location.href = currentCallbackUrl;
          }
        }
      } else {
        // --- 登录逻辑 ---
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          setError('邮箱或密码错误，请重试'); // 模糊化错误信息更安全
        } else {
          window.location.href = currentCallbackUrl;
        }
      }
    } catch (err) {
      setError('发生意外错误，请稍后重试');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-lg p-8">
        <div className="flex items-center justify-center mb-6">
          <div className="bg-indigo-600 p-2 rounded-lg text-white shadow-md">
            <span className="text-2xl">🍽️</span>
          </div>
          <span className="font-extrabold text-2xl ml-2 text-slate-900">MoodFood<span className="text-indigo-600">.AI</span></span>
        </div>

        {/* 标题随模式改变 */}
        <h1 className="text-2xl font-bold text-center mb-8">
          {isSignUp ? '注册新账号' : '登录您的账号'}
        </h1>

        {/* 错误提示 */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 text-sm">
            {error}
          </div>
        )}

        {/* 成功提示 */}
        {successMsg && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6 text-sm">
            {successMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1">
              邮箱
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-100"
              placeholder="请输入邮箱"
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1">
              密码
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-100"
              placeholder={isSignUp ? "请设置您的密码 (至少6位)" : "请输入密码"}
              minLength={6}
              required
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl shadow-md hover:bg-indigo-700 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
            disabled={isLoading}
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                {/* 这里保留了原本的 Loading SVG */}
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {isSignUp ? '注册中...' : '登录中...'}
              </span>
            ) : (
              isSignUp ? '立即注册' : '登录'
            )}
          </button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-sm text-slate-600">
            {isSignUp ? '已有账号？' : '还没有账号？'}
            {/* 修复点：将 a 标签改为 button，并绑定切换状态的事件 */}
            <button 
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError(''); // 切换时清空错误信息
                setSuccessMsg('');
              }} 
              className="text-indigo-600 font-bold hover:underline ml-1 focus:outline-none"
            >
              {isSignUp ? '去登录' : '去注册'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignInPage;