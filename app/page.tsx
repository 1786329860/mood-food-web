"use client";

import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles, ChefHat, Brain, Heart, Loader2, Calculator, X,
  Home, Users, TrendingUp, MessageCircle, Send, ShoppingBag,
  Plus, ArrowRight, Utensils, Calendar, LogOut, User, Save
} from 'lucide-react';

import {
  TabType, MoodType, UserProfile, DayPlan, InventoryItem,
  MOOD_OPTIONS, COMMUNITY_POSTS
} from './shared';

import { supabase } from '../utils/supabase';
// 注意：这里我们稍后会修改 client.ts 以支持 JSON 模式
import { generateRecipe as generateRecipeFromAI } from '../lib/deepseek/client';

export default function MoodFoodWeb() {
  // ==========================
  // A. 全局状态
  // ==========================
  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [showChat, setShowChat] = useState(false);
  const [user, setUser] = useState<any>(null); // 当前登录用户

  // 用户数据 (Profile)
  const [profile, setProfile] = useState<UserProfile>({
    age: 25, height: 165, weight: 60, gender: 'female', activity: 1.375, goal: 'lose'
  });
  const [targetCal, setTargetCal] = useState(0);
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // 冰箱库存
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [newIngredient, setNewIngredient] = useState('');
  const [newIngredientQuantity, setNewIngredientQuantity] = useState('');
  const [isLoadingInventory, setIsLoadingInventory] = useState(false);

  // 首页生成器状态
  const [selectedMood, setSelectedMood] = useState<MoodType | null>(null);
  const [lazyMode, setLazyMode] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedResult, setGeneratedResult] = useState<any>(null);

  // 聊天状态
  const [messages, setMessages] = useState<{ role: string, text: string }[]>([
    { role: 'ai', text: '你好！我是你的情绪营养师。今天感觉怎么样？' }
  ]);
  const [inputMsg, setInputMsg] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  // ==========================
  // B. 核心业务逻辑
  // ==========================

  // 1. 监听登录状态 & 加载数据
  useEffect(() => {
    // 初始化检查
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      if (user) {
        fetchProfile(user.id);
        fetchInventory(user.id);
      }
    });

    // 监听变化（登录/退出）
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
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // 加载档案
  const fetchProfile = async (userId: string) => {
    const { data } = await supabase.from('profiles').select('*').eq('id', userId).single();
    if (data) setProfile(data as UserProfile);
  };

  // 加载库存
  const fetchInventory = async (userId: string) => {
    setIsLoadingInventory(true);
    const { data } = await supabase.from('inventory').select('*').eq('user_id', userId);
    if (data) setInventory(data as InventoryItem[]);
    setIsLoadingInventory(false);
  };

  // 2. 自动计算目标热量
  useEffect(() => {
    let bmr = 0;
    if (profile.gender === 'male') {
      bmr = 88.362 + (13.397 * profile.weight) + (4.799 * profile.height) - (5.677 * profile.age);
    } else {
      bmr = 447.593 + (9.247 * profile.weight) + (3.098 * profile.height) - (4.330 * profile.age);
    }
    const tdee = bmr * profile.activity;
    let adjustment = profile.goal === 'lose' ? -500 : profile.goal === 'gain' ? 300 : 0;
    setTargetCal(Math.round(tdee + adjustment));
  }, [profile]);

  // 3. 更新档案（防抖或手动保存）
  const updateProfile = async (updates: Partial<UserProfile>) => {
    const newProfile = { ...profile, ...updates };
    setProfile(newProfile); // 乐观更新 UI

    if (user) {
      setIsSavingProfile(true);
      // 如果 profiles 表不存在该用户，需要 upsert
      const { error } = await supabase.from('profiles').upsert({
        id: user.id,
        ...newProfile,
        updated_at: new Date().toISOString()
      });
      setIsSavingProfile(false);
      if (error) console.error('保存失败:', error);
    }
  };

  // 4. 库存操作
  const addInventory = async () => {
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

  const removeInventory = async (id: string) => {
    await supabase.from('inventory').delete().eq('id', id);
    setInventory(inventory.filter(i => i.id !== id));
  };

  // 5. AI 生成食谱 (真·DeepSeek 调用)
  const handleGenerate = async () => {
    if (!selectedMood) return;
    setIsGenerating(true);
    setGeneratedResult(null); // 清空旧结果

    try {
      const inventoryNames = inventory.map(item => item.name);
      
      // 调用 API (注意：这里我们期望返回 JSON 字符串)
      const aiRawText = await generateRecipeFromAI(selectedMood, inventoryNames, lazyMode);
      
      console.log("DeepSeek Raw Response:", aiRawText); // 调试用

      // 尝试解析 JSON
      // 为了防止 AI 返回 Markdown 代码块 (```json ... ```)，我们需要清洗一下
      const jsonString = aiRawText.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsedResult = JSON.parse(jsonString);

      setGeneratedResult(parsedResult);

    } catch (error) {
      console.error('AI 生成失败:', error);
      alert('AI 脑子有点乱，请重试或检查控制台日志');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.reload();
  };

  // ==========================
  // C. 视图渲染
  // ==========================
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans flex flex-col">

      {/* 1. 顶部导航 - 动态显示登录状态 */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 lg:px-8 h-16 flex justify-between items-center">
          <div className="flex items-center gap-2 cursor-pointer group" onClick={() => setActiveTab('home')}>
            <div className="bg-indigo-600 p-2 rounded-lg text-white shadow-md group-hover:scale-105 transition-transform"><ChefHat size={20} /></div>
            <span className="font-extrabold text-xl text-slate-900">MoodFood<span className="text-indigo-600">.AI</span></span>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex flex-col items-end mr-1">
              <span className="text-[10px] text-slate-400 font-bold uppercase">每日目标</span>
              <span className="text-sm font-extrabold text-indigo-600">{targetCal} kcal</span>
            </div>

            {user ? (
              // 登录后状态
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-700 font-bold border border-indigo-200" title={user.email}>
                  {user.email?.[0].toUpperCase()}
                </div>
                <button onClick={handleLogout} className="text-slate-400 hover:text-red-500">
                  <LogOut size={20} />
                </button>
              </div>
            ) : (
              // 未登录状态
              <button onClick={() => window.location.href = '/auth/signin'} className="px-4 py-2 text-sm font-medium text-indigo-600 bg-white border border-indigo-200 rounded-lg hover:bg-indigo-50 transition-colors">
                登录 / 注册
              </button>
            )}
          </div>
        </div>
      </header>

      {/* 2. 主内容区 */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 lg:px-8 py-8">
        {activeTab === 'home' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in">
            <div className="lg:col-span-5 space-y-6">
              
              {/* 身体档案 - 可编辑版 */}
              <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm relative group">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold flex gap-2"><Calculator size={18} /> 身体档案</h3>
                  {isSavingProfile && <span className="text-xs text-indigo-500 animate-pulse">保存中...</span>}
                </div>
                
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="bg-slate-50 p-2 rounded-xl border border-transparent focus-within:border-indigo-300 transition-colors">
                    <div className="text-slate-400 text-xs font-bold mb-1">体重 (kg)</div>
                    <input
                      type="number"
                      value={profile.weight}
                      onChange={(e) => updateProfile({ weight: Number(e.target.value) })}
                      className="w-full bg-transparent text-center font-bold outline-none"
                    />
                  </div>
                  <div className="bg-slate-50 p-2 rounded-xl border border-transparent focus-within:border-indigo-300 transition-colors">
                    <div className="text-slate-400 text-xs font-bold mb-1">身高 (cm)</div>
                    <input
                      type="number"
                      value={profile.height}
                      onChange={(e) => updateProfile({ height: Number(e.target.value) })}
                      className="w-full bg-transparent text-center font-bold outline-none"
                    />
                  </div>
                  <div className="bg-slate-50 p-2 rounded-xl border border-transparent focus-within:border-indigo-300 transition-colors">
                    <div className="text-slate-400 text-xs font-bold mb-1">年龄</div>
                    <input
                      type="number"
                      value={profile.age}
                      onChange={(e) => updateProfile({ age: Number(e.target.value) })}
                      className="w-full bg-transparent text-center font-bold outline-none"
                    />
                  </div>
                </div>
                
                <div className="mt-4 grid grid-cols-2 gap-2">
                   <select
                     value={profile.gender}
                     onChange={(e) => updateProfile({ gender: e.target.value as any })}
                     className="bg-slate-50 text-sm p-2 rounded-lg outline-none"
                   >
                     <option value="female">女</option>
                     <option value="male">男</option>
                   </select>
                   <select
                     value={profile.goal}
                     onChange={(e) => updateProfile({ goal: e.target.value as any })}
                     className="bg-slate-50 text-sm p-2 rounded-lg outline-none"
                   >
                     <option value="lose">减脂</option>
                     <option value="maintain">保持</option>
                     <option value="gain">增肌</option>
                   </select>
                </div>
                
                {!user && <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] flex items-center justify-center rounded-3xl">
                  <span className="text-sm font-bold text-slate-500 bg-white px-3 py-1 rounded shadow">登录后可编辑</span>
                </div>}
              </div>

              {/* 冰箱库存 */}
              <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm relative">
                <h3 className="font-bold mb-3 flex gap-2"><ShoppingBag size={18} /> 冰箱库存</h3>
                <div className="flex flex-wrap gap-2 mb-4 min-h-[40px]">
                  {inventory.length === 0 ? (
                    <span className="text-slate-400 text-sm">空空如也，加点什么吧</span>
                  ) : (
                    inventory.map(item => (
                      <span key={item.id} className="px-3 py-1 bg-slate-100 text-xs rounded-full flex gap-1 group items-center">
                        {item.name}
                        <button onClick={() => removeInventory(item.id)} className="hover:text-red-500 ml-1">
                          <X size={12} />
                        </button>
                      </span>
                    ))
                  )}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newIngredient}
                    onChange={(e) => setNewIngredient(e.target.value)}
                    placeholder="食材..."
                    className="flex-1 text-sm bg-slate-50 border rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-indigo-100"
                  />
                  <button
                    onClick={addInventory}
                    className="bg-slate-800 text-white p-2 rounded-xl hover:bg-slate-700 transition-colors"
                  >
                    <Plus size={20} />
                  </button>
                </div>
                {!user && <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] flex items-center justify-center rounded-3xl">
                  <span className="text-sm font-bold text-slate-500 bg-white px-3 py-1 rounded shadow">登录后管理库存</span>
                </div>}
              </div>

              {/* 生成控制台 */}
              <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-lg">
                <h2 className="text-2xl font-extrabold mb-2">此刻心情如何？</h2>
                <div className="bg-slate-100 p-1 rounded-xl flex mb-6">
                  <button onClick={() => setLazyMode(false)} className={`flex-1 py-2 rounded-lg text-sm font-bold ${!lazyMode ? 'bg-white shadow text-indigo-600' : 'text-slate-400'}`}>自己做</button>
                  <button onClick={() => setLazyMode(true)} className={`flex-1 py-2 rounded-lg text-sm font-bold ${lazyMode ? 'bg-white shadow text-orange-500' : 'text-slate-400'}`}>点外卖</button>
                </div>
                <div className="grid grid-cols-3 gap-3 mb-6">
                  {MOOD_OPTIONS.map((mood) => (
                    <button key={mood.label} onClick={() => setSelectedMood(mood.label as MoodType)} className={`flex flex-col items-center p-3 rounded-xl border-2 transition-all ${selectedMood === mood.label ? mood.color : 'bg-slate-50 border-transparent hover:bg-slate-100'}`}>
                      {mood.icon}
                      <span className="text-xs font-bold mt-2">{mood.label}</span>
                    </button>
                  ))}
                </div>
                <button onClick={handleGenerate} disabled={isGenerating || !selectedMood} className={`w-full py-4 rounded-xl font-bold text-white shadow-xl flex justify-center gap-2 transition-transform active:scale-95 ${lazyMode ? 'bg-orange-500 hover:bg-orange-600' : 'bg-indigo-600 hover:bg-indigo-700'} disabled:opacity-50`}>
                  {isGenerating ? <Loader2 className="animate-spin" /> : <Sparkles size={20} />}
                  {isGenerating ? 'AI 正在思考...' : '生成治愈菜单'}
                </button>
              </div>
            </div>

            {/* 右侧结果 - 动态渲染 AI 返回的 JSON */}
            <div className="lg:col-span-7 flex flex-col gap-6">
              {generatedResult ? (
                <div className="animate-in slide-in-from-right-8 space-y-6">
                  {/* 科学分析卡片 */}
                  <div className="bg-indigo-50 border border-indigo-100 p-6 rounded-3xl flex gap-4">
                    <div className="bg-white p-3 rounded-2xl h-fit text-indigo-600"><Brain size={24} /></div>
                    <div>
                      <h4 className="font-bold text-indigo-900 mb-1">AI 情绪营养分析</h4>
                      <p className="text-sm text-indigo-900/80 leading-relaxed">{generatedResult.science}</p>
                    </div>
                  </div>

                  {/* 菜单列表 */}
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
                              <Sparkles size={14} /> 推荐理由：{item.reason}
                            </div>
                          </div>
                          <div className="text-2xl font-extrabold text-slate-700">{item.cal}<span className="text-xs font-normal text-slate-400 ml-1">kcal</span></div>
                        </div>
                        <div className="mt-6 pt-4 border-t border-slate-50 flex justify-between opacity-80">
                          <button className="text-slate-400 hover:text-red-500 transition-colors"><Heart size={20} /></button>
                          <button className="text-sm font-bold text-indigo-600 flex items-center gap-1 hover:underline">
                            {lazyMode ? '去美团搜索' : '查看详细做法'} <ArrowRight size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="h-full bg-white/50 border-2 border-dashed border-slate-200 rounded-3xl flex flex-col items-center justify-center text-slate-400 min-h-[500px]">
                  <div className="bg-slate-100 p-6 rounded-full mb-4 text-slate-300"><Utensils size={40} /></div>
                  <p>选择心情，等待 AI 投喂...</p>
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* 其他 Tab 的占位内容... */}
        {activeTab !== 'home' && (
           <div className="text-center py-20 text-slate-400">功能开发中...</div>
        )}
      </main>
    </div>
  );
}