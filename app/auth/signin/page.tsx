'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';

const SignInPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  // 简化处理，直接使用默认值，避免使用useSearchParams
  const callbackUrl = '/'; // 或者使用 window.location.search 手动解析

  // 可选：手动解析URL参数
  const getCallbackUrl = () => {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('callbackUrl') || '/';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      // 获取当前URL中的callbackUrl
      const currentCallbackUrl = getCallbackUrl();
      
      const result = await signIn('credentials', {
        username: email,
        password,
        redirect: false,
        callbackUrl: currentCallbackUrl,
      });

      if (result?.error) {
        setError('登录失败，请检查邮箱和密码');
      } else if (result?.ok) {
        // 如果登录成功，跳转到回调URL
        window.location.href = currentCallbackUrl;
      }
    } catch (err) {
      setError('登录过程中发生错误');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-lg p-8">
        <div className="flex items-center justify-center mb-6">
          <div className="bg-indigo-600 p-2 rounded-lg text-white shadow-md">
            {/* 使用适当的图标 */}
            <span className="text-2xl">🍽️</span>
          </div>
          <span className="font-extrabold text-2xl ml-2 text-slate-900">MoodFood<span className="text-indigo-600">.AI</span></span>
        </div>

        <h1 className="text-2xl font-bold text-center mb-8">登录您的账号</h1>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
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
              placeholder="请输入密码"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl shadow-md hover:bg-indigo-700 transition-colors"
          >
            登录
          </button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-sm text-slate-600">
            还没有账号？
            <a href="#" className="text-indigo-600 font-bold hover:underline ml-1">
              注册
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignInPage;