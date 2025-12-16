// app/LanguageContext.tsx 
"use client";

import React, { createContext, useContext, useState, useEffect } from 'react'; 
import { translations, Locale } from '@/lib/i18n';

interface LanguageContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string) => string;
}

const defaultContextValue: LanguageContextType = {
  locale: 'zh',
  setLocale: () => {},
  t: (key) => translations['zh'][key as keyof typeof translations['zh']] || key,
};

const LanguageContext = createContext<LanguageContextType>(defaultContextValue);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  // 1. 尝试直接从 localStorage 初始化 state (避免 Hydration Mismatch 的闪烁)
  // 注意：在服务端渲染时 localStorage 不存在，所以需要判断
  const [locale, setLocaleState] = useState<Locale>('zh');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // 页面加载时读取偏好
    const savedLocale = localStorage.getItem('app-locale') as Locale;
    if (savedLocale && (savedLocale === 'zh' || savedLocale === 'en')) {
      setLocaleState(savedLocale);
    } else {
      // 如果没有本地存储，检测浏览器
      const browserLang = navigator.language.toLowerCase();
      if (browserLang.startsWith('zh')) {
        setLocaleState('zh');
      } else {
        setLocaleState('en');
      }
    }
  }, []);

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale);
    localStorage.setItem('app-locale', newLocale);
  };

  const t = (key: string) => {
    // 确保 translations[locale] 存在，防止崩溃
    const dict = translations[locale] || translations['zh'];
    // 使用类型断言确保 TypeScript 允许将字符串作为键
    return dict[key as keyof typeof dict] || key;
  };

  // 避免服务端渲染内容与客户端不一致导致的 Hydration 警告
  // 在 mounted 之前渲染 null 或者默认语言结构
  if (!mounted) {
    return (
      <LanguageContext.Provider value={{ locale: 'zh', setLocale, t }}>
         {children}
      </LanguageContext.Provider>
    );
  }

  return (
    <LanguageContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export const useLanguage = () => {
  return useContext(LanguageContext);
};