"use client";

import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles, ChefHat, Brain, Heart, Loader2, Calculator, X,
  Home, Users, TrendingUp, MessageCircle, Send, ShoppingBag,
  Plus, ArrowRight, Utensils, Calendar, LogOut, User, Save, Globe,
  Info, CheckCircle2 // 新增图标
} from 'lucide-react';

import {
  TabType, MoodType, UserProfile, InventoryItem,
  MOOD_OPTIONS, WeeklyPlanResult // 引入新类型
} from './shared';

import { supabase } from '../utils/supabase';
// 引入新增加的 generateWeeklyPlan
import { generateRecipe as generateRecipeFromAI, generateWeeklyPlan } from '../lib/deepseek/client';
import { useLanguage } from './LanguageContext';

export default function MoodFoodWeb() {
  const { t, locale, setLocale } = useLanguage();
  
  // ... (保留原有的 activeTab, user 等状态)
  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [user, setUser] = useState<any>(null);

  // 用户数据
  const [profile, setProfile] = useState<UserProfile>({
    age: 25, height: 165, weight: 60, gender: 'female', activity: 1.375, goal: 'lose'
  });
  
  // --- 新增状态：BMI 与 推荐目标 ---
  const [bmiValue, setBmiValue] = useState<string>('');
  const [recommendedGoal, setRecommendedGoal] = useState<'lose' | 'maintain' | 'gain' | null>(null);

  // --- 新增状态：周计划 ---
  const [weeklyPlan, setWeeklyPlan] = useState<WeeklyPlanResult | null>(null);
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);

  // ... (保留原有的 inventory, lazyMode, generatedResult 等状态)
  const [targetCal, setTargetCal] = useState(0);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [newIngredient, setNewIngredient] = useState('');
  const [newIngredientQuantity, setNewIngredientQuantity] = useState('');
  const [isLoadingInventory, setIsLoadingInventory] = useState(false);
  const [selectedMood, setSelectedMood] = useState<MoodType | null>(null);
  const [lazyMode, setLazyMode] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedResult, setGeneratedResult] = useState<any>(null);

  // ... (保留 useEffect 监听登录状态)
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      if (user) {
        fetchProfile(user.id);
        fetchInventory(user.id);
      }
    });
    // ... (保留 auth 监听)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        setUser(session?.user ?? null);
        if (session?.user) {
          fetchProfile(session.user.id);
          fetchInventory(session.user.id);
        } else {
          // 退出后重置为默认
          setProfile({ age: 25, height: 165, weight: 60, gender: 'female', activity: 1.375, goal: 'lose' });
          setInventory([]);
          setGeneratedResult(null);
          setWeeklyPlan(null); // 重置计划
        }
      });
      return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId: string) => {
    const { data } = await supabase.from('profiles').select('*').eq('id', userId).single();
    if (data) setProfile(data as UserProfile);
  };
  
  const fetchInventory = async (userId: string) => { /* ... 保留原逻辑 ... */
    setIsLoadingInventory(true);
    const { data } = await supabase.from('inventory').select('*').eq('user_id', userId);
    if (data) setInventory(data as InventoryItem[]);
    setIsLoadingInventory(false);
  };

  // 2. 修改：自动计算目标热量 + BMI 推荐逻辑
  useEffect(() => {
    // A. 热量计算 (原逻辑)
    let bmr = 0;
    if (profile.gender === 'male') {
      bmr = 88.362 + (13.397 * profile.weight) + (4.799 * profile.height) - (5.677 * profile.age);
    } else {
      bmr = 447.593 + (9.247 * profile.weight) + (3.098 * profile.height) - (4.330 * profile.age);
    }
    const tdee = bmr * profile.activity;
    let adjustment = profile.goal === 'lose' ? -500 : profile.goal === 'gain' ? 300 : 0;
    setTargetCal(Math.round(tdee + adjustment));

    // B. 新增：BMI 计算与推荐
    if (profile.height > 0 && profile.weight > 0) {
      const h = profile.height / 100;
      const bmi = profile.weight / (h * h);
      setBmiValue(bmi.toFixed(1));

      // 简单推荐逻辑
      if (bmi < 18.5) setRecommendedGoal('gain');
      else if (bmi >= 24) setRecommendedGoal('lose'); // 中国标准 24+ 为超重
      else setRecommendedGoal('maintain');
    }
  }, [profile]);

  // ... (保留 updateProfile, addInventory, removeInventory, handleGenerate, handleLogout)
  const updateProfile = async (updates: Partial<UserProfile>) => { /* ... 保留 ... */
    const newProfile = { ...profile, ...updates };
    setProfile(newProfile);

    if (user) {
      setIsSavingProfile(true);
      const { error } = await supabase.from('profiles').upsert({
        id: user.id,
        ...newProfile,
        updated_at: new Date().toISOString()
      });
      setIsSavingProfile(false);
      if (error) console.error('保存失败:', error);
    }
  };

  const addInventory = async () => { /* ... 保留 ... */
    if (!newIngredient.trim() || !user) return;
    const { data, error } = await supabase.from('inventory').insert({
      user_id: user.id,
      name: newIngredient.trim(),
      quantity: newIngredientQuantity.trim() || '1'
    }).select();

    if (data) {
      setInventory([...inventory, data[0] as InventoryItem]);
      setNewIngredient('');
      setNewIngredientQuantity('');
    }
  };

  const removeInventory = async (id: string) => { /* ... 保留 ... */
    await supabase.from('inventory').delete().eq('id', id);
    setInventory(inventory.filter(i => i.id !== id));
  };

  const handleGenerate = async () => {
    if (!selectedMood) return;
    setIsGenerating(true);
    setGeneratedResult(null);
    try {
      const inventoryNames = inventory.map(item => item.name);
      
      // 🔥 关键修改：传入 locale 参数
      const aiRawText = await generateRecipeFromAI(
        selectedMood,
        inventoryNames,
        lazyMode,
        locale // <--- 这里必须传！
      );
      
      const jsonString = aiRawText.replace(/```json/g, '').replace(/```/g, '').trim();
      setGeneratedResult(JSON.parse(jsonString));
    } catch (error) {
      console.error('Error:', error);
      alert(locale === 'zh' ? 'AI繁忙，请稍后再试' : 'AI Busy, please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleLogout = async () => { /* ... 保留 ... */
    await supabase.auth.signOut();
    window.location.reload();
  };

  // --- 新增：处理生成周计划 ---
  const handleGeneratePlan = async () => {
    setIsGeneratingPlan(true);
    try {
      // 🔥 关键修改：传入 locale 参数
      const aiRawText = await generateWeeklyPlan(
        profile,
        locale // <--- 这里必须传！
      );
      
      const jsonString = aiRawText.replace(/```json/g, '').replace(/```/g, '').trim();
      setWeeklyPlan(JSON.parse(jsonString));
    } catch (error) {
      console.error("Plan Error", error);
    } finally {
      setIsGeneratingPlan(false);
    }
  };

  // --- 新增：处理“查看详细做法”点击 ---
  const handleViewRecipe = (item: any) => {
    // 简单实现：弹窗显示详细信息
    // 这里的 item.desc 通常包含了做法简介，如果需要更详细步骤，可能需要再次调用 AI
    alert(`【${item.name}】\n\n${item.desc}\n\n推荐理由：${item.reason}`);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans flex flex-col">
      {/* ... (Header 保留) ... */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 lg:px-8 h-16 flex justify-between items-center">
          <div className="flex items-center gap-2 cursor-pointer group" onClick={() => setActiveTab('home')}>
            <div className="bg-indigo-600 p-2 rounded-lg text-white shadow-md group-hover:scale-105 transition-transform"><ChefHat size={20} /></div>
            <span className="font-extrabold text-xl text-slate-900">MoodFood<span className="text-indigo-600">.AI</span></span>
          </div>
          
          <div className="flex items-center gap-4">
             {/* 导航菜单 */}
             <nav className="hidden md:flex gap-6 mr-4 text-sm font-bold text-slate-500">
                <button onClick={() => setActiveTab('home')} className={`hover:text-indigo-600 transition ${activeTab === 'home' ? 'text-indigo-600' : ''}`}>{t('home')}</button>
                <button onClick={() => setActiveTab('plan')} className={`hover:text-indigo-600 transition ${activeTab === 'plan' ? 'text-indigo-600' : ''}`}>{t('plan')}</button>
                <button onClick={() => setActiveTab('community')} className={`hover:text-indigo-600 transition ${activeTab === 'community' ? 'text-indigo-600' : ''}`}>{t('community')}</button>
             </nav>

            <button
              onClick={() => setLocale(locale === 'zh' ? 'en' : 'zh')}
              className="p-2 text-slate-400 hover:text-indigo-600 transition-colors flex items-center gap-1 text-xs font-bold uppercase"
            >
              <Globe size={18} />
              {locale === 'zh' ? 'EN' : '中'}
            </button>
            
            {/* ... 保留 user 状态显示 ... */}
            {user ? (
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-700 font-bold border border-indigo-200" title={user.email}>
                  {user.email?.[0].toUpperCase()}
                </div>
                <button onClick={handleLogout} className="text-slate-400 hover:text-red-500">
                  <LogOut size={20} />
                </button>
              </div>
            ) : (
              <button onClick={() => window.location.href = '/auth/signin'} className="px-4 py-2 text-sm font-medium text-indigo-600 bg-white border border-indigo-200 rounded-lg hover:bg-indigo-50 transition-colors">
                {t('login')} / {t('register')}
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 lg:px-8 py-8">
        
        {/* ================= HOME TAB ================= */}
        {activeTab === 'home' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in">
            <div className="lg:col-span-5 space-y-6">
              
              {/* 身体档案 - 修改：增加 BMI 显示与推荐 */}
              <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm relative group">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold flex gap-2"><Calculator size={18} /> {t('bodyProfile')}</h3>
                  <div className="flex items-center gap-2">
                    {bmiValue && <span className="text-xs font-bold bg-slate-100 px-2 py-1 rounded text-slate-500">BMI: {bmiValue}</span>}
                    {isSavingProfile && <span className="text-xs text-indigo-500 animate-pulse">{t('saving')}</span>}
                  </div>
                </div>
                
                {/* ... (输入框部分保留) ... */}
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="bg-slate-50 p-2 rounded-xl border border-transparent focus-within:border-indigo-300 transition-colors">
                    <div className="text-slate-400 text-xs font-bold mb-1">{t('weight')} (kg)</div>
                    <input type="number" value={profile.weight} onChange={(e) => updateProfile({ weight: Number(e.target.value) })} className="w-full bg-transparent text-center font-bold outline-none"/>
                  </div>
                  <div className="bg-slate-50 p-2 rounded-xl border border-transparent focus-within:border-indigo-300 transition-colors">
                    <div className="text-slate-400 text-xs font-bold mb-1">{t('height')} (cm)</div>
                    <input type="number" value={profile.height} onChange={(e) => updateProfile({ height: Number(e.target.value) })} className="w-full bg-transparent text-center font-bold outline-none"/>
                  </div>
                  <div className="bg-slate-50 p-2 rounded-xl border border-transparent focus-within:border-indigo-300 transition-colors">
                    <div className="text-slate-400 text-xs font-bold mb-1">{t('age')}</div>
                    <input type="number" value={profile.age} onChange={(e) => updateProfile({ age: Number(e.target.value) })} className="w-full bg-transparent text-center font-bold outline-none"/>
                  </div>
                </div>
                
                {/* 修改：目标选择部分增加推荐逻辑 */}
                <div className="mt-4 grid grid-cols-2 gap-2">
                   <select
                     value={profile.gender}
                     onChange={(e) => updateProfile({ gender: e.target.value as any })}
                     className="bg-slate-50 text-sm p-2 rounded-lg outline-none"
                   >
                     <option value="female">{t('female')}</option>
                     <option value="male">{t('male')}</option>
                   </select>
                   
                   <div className="relative">
                     <select
                        value={profile.goal}
                        onChange={(e) => updateProfile({ goal: e.target.value as any })}
                        className={`w-full bg-slate-50 text-sm p-2 rounded-lg outline-none border ${recommendedGoal && recommendedGoal !== profile.goal ? 'border-orange-300' : 'border-transparent'}`}
                     >
                       <option value="lose">{t('lose')} {recommendedGoal === 'lose' ? '(推荐)' : ''}</option>
                       <option value="maintain">{t('maintain')} {recommendedGoal === 'maintain' ? '(推荐)' : ''}</option>
                       <option value="gain">{t('gain')} {recommendedGoal === 'gain' ? '(推荐)' : ''}</option>
                     </select>
                     {/* 推荐提示 */}
                     {recommendedGoal && recommendedGoal !== profile.goal && (
                        <div className="absolute -top-6 right-0 bg-orange-100 text-orange-600 text-[10px] px-2 py-0.5 rounded shadow-sm flex items-center animate-bounce">
                           建议选择: {t(recommendedGoal)}
                        </div>
                     )}
                   </div>
                </div>
                
                {!user && <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] flex items-center justify-center rounded-3xl">
                  <span className="text-sm font-bold text-slate-500 bg-white px-3 py-1 rounded shadow">{t('loginToEdit')}</span>
                </div>}
              </div>

              {/* ... (冰箱库存部分完全保留) ... */}
              <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm relative">
                <h3 className="font-bold mb-3 flex gap-2"><ShoppingBag size={18} /> {t('fridgeInventory')}</h3>
                <div className="flex flex-wrap gap-2 mb-4 min-h-[40px]">
                  {inventory.length === 0 ? (
                    <span className="text-slate-400 text-sm">{t('inventoryEmpty')}</span>
                  ) : (
                    inventory.map(item => (
                      <span key={item.id} className="px-3 py-1 bg-slate-100 text-xs rounded-full flex gap-1 group items-center">
                        {item.name}
                        <button onClick={() => removeInventory(item.id)} className="hover:text-red-500 ml-1"><X size={12} /></button>
                      </span>
                    ))
                  )}
                </div>
                <div className="flex gap-2">
                  <input type="text" value={newIngredient} onChange={(e) => setNewIngredient(e.target.value)} placeholder={t('ingredientName')} className="flex-1 text-sm bg-slate-50 border rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-indigo-100"/>
                  <button onClick={addInventory} className="bg-slate-800 text-white p-2 rounded-xl hover:bg-slate-700 transition-colors"><Plus size={20} /></button>
                </div>
                {!user && <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] flex items-center justify-center rounded-3xl">
                  <span className="text-sm font-bold text-slate-500 bg-white px-3 py-1 rounded shadow">{t('loginToManage')}</span>
                </div>}
              </div>

              {/* ... (生成控制台部分完全保留) ... */}
              <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-lg">
                <h2 className="text-2xl font-extrabold mb-2">{t('moodQuestion')}</h2>
                <div className="bg-slate-100 p-1 rounded-xl flex mb-6">
                  <button onClick={() => setLazyMode(false)} className={`flex-1 py-2 rounded-lg text-sm font-bold ${!lazyMode ? 'bg-white shadow text-indigo-600' : 'text-slate-400'}`}>{t('cooking')}</button>
                  <button onClick={() => setLazyMode(true)} className={`flex-1 py-2 rounded-lg text-sm font-bold ${lazyMode ? 'bg-white shadow text-orange-500' : 'text-slate-400'}`}>{t('delivery')}</button>
                </div>
                <div className="grid grid-cols-3 gap-3 mb-6">
                  {MOOD_OPTIONS.map((mood) => (
                    <button key={mood.label} onClick={() => setSelectedMood(mood.label as MoodType)} className={`flex flex-col items-center p-3 rounded-xl border-2 transition-all ${selectedMood === mood.label ? mood.color : 'bg-slate-50 border-transparent hover:bg-slate-100'}`}>
                      {mood.icon}
                      {/* 修改这里：使用 t(mood.id) 替代 mood.label */}
                      <span className="text-xs font-bold mt-2">{t(mood.id)}</span>
                    </button>
                  ))}
                </div>
                <button onClick={handleGenerate} disabled={isGenerating || !selectedMood} className={`w-full py-4 rounded-xl font-bold text-white shadow-xl flex justify-center gap-2 transition-transform active:scale-95 ${lazyMode ? 'bg-orange-500 hover:bg-orange-600' : 'bg-indigo-600 hover:bg-indigo-700'} disabled:opacity-50`}>
                  {isGenerating ? <Loader2 className="animate-spin" /> : <Sparkles size={20} />}
                  {isGenerating ? t('generating') : t('generateBtn')}
                </button>
              </div>
            </div>

            {/* 右侧结果 */}
            <div className="lg:col-span-7 flex flex-col gap-6">
              {generatedResult ? (
                <div className="animate-in slide-in-from-right-8 space-y-6">
                  {/* ... (科学分析卡片保留) ... */}
                  <div className="bg-indigo-50 border border-indigo-100 p-6 rounded-3xl flex gap-4">
                    <div className="bg-white p-3 rounded-2xl h-fit text-indigo-600"><Brain size={24} /></div>
                    <div>
                      <h4 className="font-bold text-indigo-900 mb-1">{t('aiAnalysis')}</h4>
                      <p className="text-sm text-indigo-900/80 leading-relaxed">{generatedResult.science}</p>
                    </div>
                  </div>

                  {/* 菜单列表 - 修改：修复 View Recipe 按钮 */}
                  <div className="grid gap-4">
                    {generatedResult.menu?.map((item: any, i: number) => (
                      <div key={i} className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 hover:shadow-lg transition-all group relative overflow-hidden">
                        <div className="relative z-10 flex justify-between">
                          <div className="flex-1 pr-4">
                            <div className="flex items-center gap-3 mb-2">
                              {item.tags?.map((tag:string) => (
                                <span key={tag} className="text-[10px] font-bold px-2 py-1 rounded border uppercase bg-indigo-50 text-indigo-600">{tag}</span>
                              ))}
                              <h4 className="font-bold text-xl">{item.name}</h4>
                            </div>
                            <p className="text-sm text-slate-500 mb-3">{item.desc}</p>
                            <div className="flex items-center gap-1.5 text-xs text-indigo-600 bg-indigo-50 w-fit px-3 py-1.5 rounded-lg">
                              <Sparkles size={14} /> {t('recommendReason')}：{item.reason}
                            </div>
                          </div>
                          <div className="text-2xl font-extrabold text-slate-700">{item.cal}<span className="text-xs font-normal text-slate-400 ml-1">kcal</span></div>
                        </div>
                        <div className="mt-6 pt-4 border-t border-slate-50 flex justify-between opacity-80">
                          <button className="text-slate-400 hover:text-red-500 transition-colors"><Heart size={20} /></button>
                          
                          {/* 修复：添加 onClick 事件 */}
                          <button 
                            onClick={() => handleViewRecipe(item)} 
                            className="text-sm font-bold text-indigo-600 flex items-center gap-1 hover:underline focus:outline-none"
                          >
                            {lazyMode ? t('searchDelivery') : t('viewRecipe')} <ArrowRight size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="h-full bg-white/50 border-2 border-dashed border-slate-200 rounded-3xl flex flex-col items-center justify-center text-slate-400 min-h-[500px]">
                  <div className="bg-slate-100 p-6 rounded-full mb-4 text-slate-300"><Utensils size={40} /></div>
                  <p>{t('waitingForAi')}</p>
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* ================= PLAN TAB (新增功能) ================= */}
        {activeTab === 'plan' && (
           <div className="animate-in fade-in max-w-4xl mx-auto">
             <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-8 mb-8 text-center">
                <h2 className="text-2xl font-bold mb-2">您的{profile.goal === 'lose' ? '减脂' : profile.goal === 'gain' ? '增肌' : '保持'}周期计划</h2>
                <p className="text-slate-500 mb-6">基于您的身体档案（BMI: {bmiValue || '-'}）与目标为您定制</p>
                
                <button 
                  onClick={handleGeneratePlan}
                  disabled={isGeneratingPlan || !user}
                  className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-bold shadow-lg hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 mx-auto"
                >
                  {isGeneratingPlan ? <Loader2 className="animate-spin" /> : <Calendar size={20} />}
                  {isGeneratingPlan ? '正在生成计划...' : '生成本周计划'}
                </button>
                {!user && <p className="text-xs text-red-400 mt-2">请先登录以保存和生成计划</p>}
             </div>

             {weeklyPlan && (
               <div className="space-y-6">
                 {/* 计划概述 */}
                 <div className="bg-indigo-50 border border-indigo-100 p-6 rounded-2xl">
                    <h3 className="font-bold text-indigo-900 flex items-center gap-2 mb-2">
                      <Brain size={20}/> AI 建议
                    </h3>
                    <p className="text-indigo-800/80 text-sm leading-relaxed">{weeklyPlan.summary}</p>
                 </div>

                 {/* 每日卡片 */}
                 <div className="grid gap-4">
                   {weeklyPlan.schedule.map((day, idx) => (
                     <div key={idx} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row gap-6">
                        <div className="md:w-32 flex-shrink-0 flex flex-col justify-center items-center bg-slate-50 rounded-xl p-4">
                          <span className="font-bold text-lg text-slate-700">{day.day}</span>
                          <span className="text-xs text-indigo-500 font-medium bg-indigo-50 px-2 py-1 rounded mt-2">{day.focus}</span>
                        </div>
                        <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="space-y-1">
                            <span className="text-xs font-bold text-slate-400 uppercase">早餐</span>
                            <p className="text-sm font-medium text-slate-700">{day.meals.breakfast}</p>
                          </div>
                          <div className="space-y-1">
                            <span className="text-xs font-bold text-slate-400 uppercase">午餐</span>
                            <p className="text-sm font-medium text-slate-700">{day.meals.lunch}</p>
                          </div>
                          <div className="space-y-1">
                            <span className="text-xs font-bold text-slate-400 uppercase">晚餐</span>
                            <p className="text-sm font-medium text-slate-700">{day.meals.dinner}</p>
                          </div>
                        </div>
                        <div className="md:w-48 flex-shrink-0 border-l border-slate-100 md:pl-6 flex flex-col justify-center">
                           <span className="text-xs font-bold text-slate-400 uppercase mb-1 flex items-center gap-1"><TrendingUp size={12}/> 运动建议</span>
                           <p className="text-sm text-slate-600">{day.exercise}</p>
                        </div>
                     </div>
                   ))}
                 </div>
               </div>
             )}
           </div>
        )}

        {/* ... (其他 Tab 占位符) ... */}
        {(activeTab === 'community' || activeTab === 'progress') && (
           <div className="text-center py-20 text-slate-400">
             <div className="inline-block p-4 bg-slate-100 rounded-full mb-4"><Sparkles size={32}/></div>
             <p>社区与进度功能即将上线</p>
           </div>
        )}
      </main>
    </div>
  );
}