"use client";

import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Loader2, Globe, ChefHat, Mail, Lock, Shield } from 'lucide-react';
import { useLanguage } from '../../LanguageContext';

export default function SignUp() {
  const { t, locale, setLocale } = useLanguage();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const handleSendCode = async () => {
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError(t('enterValidEmail'));
      return;
    }
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/send-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error);
      } else {
        setCodeSent(true);
        setCountdown(60);
        timerRef.current = setInterval(() => {
          setCountdown((prev) => {
            if (prev <= 1) {
              clearInterval(timerRef.current!);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      }
    } catch {
      setError(t('sendCodeFailed'));
    }
    setLoading(false);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code || code.length !== 6) {
      setError(t('enterCode'));
      return;
    }
    if (password.length < 6) {
      setError(t('passwordTooShort'));
      return;
    }
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, code }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error);
      } else {
        window.location.href = '/';
      }
    } catch {
      setError(t('registerFailed'));
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative">
      {/* Top bar */}
      <div className="absolute top-6 left-6 right-6 flex justify-between items-center z-10">
        <a href="/" className="text-slate-500 hover:text-indigo-600 flex items-center gap-2 transition-colors font-medium">
          <ArrowLeft size={20} /> <span className="hidden sm:inline">{t('backToHome')}</span>
        </a>
        <button
          type="button"
          onClick={() => setLocale(locale === 'zh' ? 'en' : 'zh')}
          className="bg-white px-3 py-1.5 rounded-full border border-slate-200 text-slate-500 hover:text-indigo-600 hover:border-indigo-200 transition-all shadow-sm flex items-center gap-1.5 text-xs font-bold"
        >
          <Globe size={16} />
          {locale === 'zh' ? 'English' : '中文'}
        </button>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="mx-auto h-16 w-16 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg text-white mb-6">
          <ChefHat size={32} />
        </div>
        <h2 className="text-3xl font-extrabold text-slate-900 mb-2">{t('createAccount')}</h2>
        <p className="text-slate-500 max-w-xs mx-auto">{t('registerSlogan')}</p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-xl shadow-slate-200/50 sm:rounded-3xl sm:px-10 border border-slate-100">
          <form className="space-y-5" onSubmit={handleRegister}>
            {/* Email */}
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">{t('emailLabel')}</label>
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Mail size={18} />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 border border-slate-200 rounded-xl focus:ring-indigo-500 focus:border-indigo-500 text-sm outline-none"
                  placeholder="name@example.com"
                />
              </div>
            </div>

            {/* Verification Code */}
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">{t('verificationCode')}</label>
              <div className="flex gap-2">
                <div className="relative flex-1 rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Shield size={18} />
                  </div>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                    className="block w-full pl-10 pr-3 py-3 border border-slate-200 rounded-xl focus:ring-indigo-500 focus:border-indigo-500 text-sm outline-none tracking-widest font-mono text-center text-lg"
                    placeholder="000000"
                    disabled={!codeSent}
                  />
                </div>
                <button
                  type="button"
                  onClick={handleSendCode}
                  disabled={loading || countdown > 0}
                  className="px-4 py-3 text-sm font-bold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors whitespace-nowrap min-w-[110px]"
                >
                  {loading ? (
                    <Loader2 className="animate-spin mx-auto" size={18} />
                  ) : countdown > 0 ? (
                    `${countdown}s`
                  ) : codeSent ? (
                    t('resendCode')
                  ) : (
                    t('sendCode')
                  )}
                </button>
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">{t('password')}</label>
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock size={18} />
                </div>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 border border-slate-200 rounded-xl focus:ring-indigo-500 focus:border-indigo-500 text-sm outline-none"
                  placeholder={t('passwordPlaceholder')}
                />
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="text-sm text-red-500 bg-red-50 p-3 rounded-xl text-center font-medium">{error}</div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none disabled:opacity-70 transition-all"
            >
              {loading ? <Loader2 className="animate-spin" size={20} /> : t('register')}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500">
            {t('alreadyHaveAccount')}{' '}
            <a href="/auth/signin" className="font-bold text-indigo-600 hover:underline">
              {t('goLogin')}
            </a>
          </p>
        </div>

        <div className="mt-8 text-center text-xs text-slate-400">{t('copyright')}</div>
      </div>
    </div>
  );
}
