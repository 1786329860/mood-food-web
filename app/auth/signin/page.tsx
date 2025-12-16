"use client"; 

import React, { useState } from 'react'; 
import { supabase } from '../../../utils/supabase'; // 请确保此路径指向正确的 supabase client 文件，如果报错请改为 '@/lib/supabase/client' 或相对路径 
import { Mail, ArrowLeft, Loader2, CheckCircle, Globe, ChefHat } from 'lucide-react'; 
import { useLanguage } from '../../LanguageContext'; // 引入多语言上下文 

export default function SignIn() { 
  // [关键] 获取 t (翻译函数) 和 locale (当前语言) 
  const { t, locale, setLocale } = useLanguage(); 
  
  const [email, setEmail] = useState(''); 
  const [loading, setLoading] = useState(false); 
  const [sent, setSent] = useState(false); 

  const handleLogin = async (e: React.FormEvent) => { 
    e.preventDefault(); 
    setLoading(true); 
    
    // 获取当前域名，确保验证后跳回正确的地址 
    // 使用 window.location.origin 自动适配 localhost 和 vercel 域名 
    const redirectTo = `${window.location.origin}/auth/callback`; 

    const { error } = await supabase.auth.signInWithOtp({ 
      email, 
      options: { 
        emailRedirectTo: redirectTo, 
      }, 
    }); 

    if (error) { 
      alert(error.message); 
    } else { 
      setSent(true); 
    } 
    setLoading(false); 
  }; 

  return ( 
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative"> 
      
      {/* 顶部导航栏：返回按钮 + 语言切换 */} 
      <div className="absolute top-6 left-6 right-6 flex justify-between items-center z-10"> 
        {/* 返回首页 */} 
        <a href="/" className="text-slate-500 hover:text-indigo-600 flex items-center gap-2 transition-colors font-medium"> 
          <ArrowLeft size={20} /> <span className="hidden sm:inline">{t('backToHome')}</span> 
        </a> 
        
        {/* [关键] 语言切换按钮 */} 
        <button 
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
        
        {/* [关键修复] 使用 t() 替换硬编码的中文 */} 
        <h2 className="text-3xl font-extrabold text-slate-900 mb-2"> 
          {t('welcomeBack')} 
        </h2> 
        <p className="text-slate-500 max-w-xs mx-auto"> 
          {t('loginSlogan')} 
        </p> 
      </div> 

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md"> 
        <div className="bg-white py-8 px-4 shadow-xl shadow-slate-200/50 sm:rounded-3xl sm:px-10 border border-slate-100"> 
          {!sent ? ( 
            <form className="space-y-6" onSubmit={handleLogin}> 
              <div> 
                <label htmlFor="email" className="block text-sm font-bold text-slate-700 mb-1"> 
                  {t('emailLabel')} 
                </label> 
                <div className="mt-1 relative rounded-md shadow-sm"> 
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400"> 
                    <Mail size={20} /> 
                  </div> 
                  <input 
                    id="email" 
                    name="email" 
                    type="email" 
                    autoComplete="email" 
                    required 
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)} 
                    className="block w-full pl-10 pr-3 py-3 border border-slate-200 rounded-xl focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-colors outline-none" 
                    placeholder="name@example.com" 
                  /> 
                </div> 
              </div> 

              <div> 
                <button 
                  type="submit" 
                  disabled={loading} 
                  className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-70 transition-all" 
                > 
                  {loading ? ( 
                    <> 
                      <Loader2 className="animate-spin -ml-1 mr-2 h-5 w-5" /> 
                      {t('sending')} 
                    </> 
                  ) : ( 
                    t('sendMagicLink') 
                  )} 
                </button> 
              </div> 
            </form> 
          ) : ( 
            <div className="text-center py-6 animate-in fade-in zoom-in duration-300"> 
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4"> 
                <CheckCircle className="h-8 w-8 text-green-600" /> 
              </div> 
              <h3 className="text-lg font-bold text-slate-900 mb-2">{t('checkEmail')}</h3> 
              <p className="text-sm text-slate-500 mb-6"> 
                {t('magicLinkSent').replace('{email}', email)} 
              </p> 
              <div className="bg-slate-50 p-4 rounded-xl text-xs text-slate-500"> 
                {t('magicLinkTip')} 
              </div> 
              <button 
                onClick={() => setSent(false)} 
                className="mt-6 text-indigo-600 font-bold text-sm hover:underline" 
              > 
                {t('back')} 
              </button> 
            </div> 
          )} 
        </div> 
        
        <div className="mt-8 text-center text-xs text-slate-400"> 
          {t('copyright')} 
        </div> 
      </div> 
    </div> 
  ); 
}