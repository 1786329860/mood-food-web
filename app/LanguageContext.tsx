// app/LanguageContext.tsx
"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { translations, Locale } from '@/lib/i18n';

interface LanguageContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: keyof typeof translations['zh']) => string;
}

// 提供默认值，避免服务器端渲染时出错
const defaultContextValue: LanguageContextType = {
  locale: 'zh',
  setLocale: () => {},
  t: (key) => translations['zh'][key] || key,
};

const LanguageContext = createContext<LanguageContextType>(defaultContextValue);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('zh'); // 默认中文
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // 1. 优先读取本地存储
    const savedLocale = localStorage.getItem('app-locale') as Locale;
    if (savedLocale && (savedLocale === 'zh' || savedLocale === 'en')) {
      setLocaleState(savedLocale);
    } else {
      // 2. 其次检测浏览器语言
      const browserLang = navigator.language.toLowerCase();
      if (browserLang.startsWith('zh')) {
        setLocaleState('zh');
      } else {
        setLocaleState('en');
      }
    }
    setIsInitialized(true);
  }, []);

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale);
    localStorage.setItem('app-locale', newLocale);
  };

  // 翻译函数 hook
  const t = (key: keyof typeof translations['zh']) => {
    return translations[locale][key] || key;
  };

  // 使用默认值作为初始值，确保在所有情况下都有上下文
  return (
    <LanguageContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

// 自定义 Hook 方便调用
export const useLanguage = () => {
  return useContext(LanguageContext);
};