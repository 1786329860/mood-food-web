"use client"; 

import React, { useState, useEffect, useRef } from 'react'; 
// 引入图标 
import { 
  Sparkles, ChefHat, Brain, Heart, Loader2, Calculator, X, 
  Home, Users, TrendingUp, MessageCircle, Send, ShoppingBag, 
  Plus, ArrowRight, Utensils, Calendar 
} from 'lucide-react'; 

// 引入shared文件中的配置 
import { 
  TabType, MoodType, UserProfile, DayPlan, FoodItem, InventoryItem, 
  MOOD_OPTIONS, COMMUNITY_POSTS 
} from './shared'; 

// 引入Supabase客户端
import { supabase } from '../utils/supabase';
// 引入DeepSeek API客户端
import { generateRecipe as generateRecipeFromAI } from '../lib/deepseek/client'; 

export default function MoodFoodWeb() { 
  // ========================== 
  // A. 全局与数据状态管理 
  // ========================== 
  const [activeTab, setActiveTab] = useState<TabType>('home'); 
  const [showChat, setShowChat] = useState(false); 

  // 用户数据 (Profile) 
  const [profile, setProfile] = useState<UserProfile>({ 
    age: 25, height: 165, weight: 60, gender: 'female', activity: 1.375, goal: 'lose' 
  }); 
  const [targetCal, setTargetCal] = useState(0); 
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  
  // 冰箱库存 
  const [inventory, setInventory] = useState<InventoryItem[]>([]); 
  const [newIngredient, setNewIngredient] = useState(''); 
  const [newIngredientQuantity, setNewIngredientQuantity] = useState(''); 
  const [isLoadingInventory, setIsLoadingInventory] = useState(true); 

  // 首页生成器状态 
  const [selectedMood, setSelectedMood] = useState<MoodType | null>(null); 
  const [lazyMode, setLazyMode] = useState(false); // false=自己做, true=外卖 
  const [isGenerating, setIsGenerating] = useState(false); 
  const [generatedResult, setGeneratedResult] = useState<any>(null); 

  // 周期计划状态 
  const [weeklyPlan, setWeeklyPlan] = useState<DayPlan[]>([]); 

  // 聊天状态 
  const [messages, setMessages] = useState<{role: string, text: string}[]>([ 
    { role: 'ai', text: '你好！我是你的情绪营养师。今天感觉怎么样？' } 
  ]); 
  const [inputMsg, setInputMsg] = useState(''); 
  const chatEndRef = useRef<HTMLDivElement>(null); 

  // ========================== 
  // B. 核心业务逻辑 
  // ========================== 

  // 从Supabase加载用户资料
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setIsLoadingProfile(true);
        // 获取当前用户
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          console.log('No user found, using default profile');
          return;
        }
        
        // 从profiles表获取用户资料
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (error) {
          console.error('Error fetching profile:', error);
          // 如果没有数据，使用默认值
        } else if (data) {
          setProfile(data as UserProfile);
        }
      } catch (error) {
        console.error('Unexpected error fetching profile:', error);
      } finally {
        setIsLoadingProfile(false);
      }
    };

    fetchProfile();
  }, []);

  // 从Supabase加载冰箱库存
  useEffect(() => {
    const fetchInventory = async () => {
      try {
        setIsLoadingInventory(true);
        
        // 获取当前用户
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          console.log('No user found, inventory not available');
          setInventory([]);
          return;
        }
        
        // 使用正确的表名和字段名
        const { data, error } = await supabase
          .from('inventory')
          .select('id, user_id, name, quantity')
          .eq('user_id', user.id);

        if (error) {
          console.error('Error fetching inventory:', error);
          setInventory([]);
        } else if (data) {
          setInventory(data as InventoryItem[]);
        }
      } catch (error) {
        console.error('Unexpected error fetching inventory:', error);
        setInventory([]);
      } finally {
        setIsLoadingInventory(false);
      }
    };

    fetchInventory();
  }, []);

  // 1. 自动计算目标热量 (Harris-Benedict 公式) 
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

  // 2. 库存管理逻辑 
  const addInventory = async () => { 
    if (!newIngredient.trim()) return;

    try {
      // 1. 获取当前用户
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        alert('请先登录');
        return;
      }

      // 2. 写入数据库
      const name = newIngredient.trim();
      const quantity = newIngredientQuantity.trim() || '1';
      
      const { data, error } = await supabase
        .from('inventory')
        .insert({ 
          user_id: user.id, 
          name, 
          quantity 
        })
        .select();

      if (error) {
        console.error('Error adding ingredient:', error);
        alert('添加失败，请重试');
      } else if (data && data[0]) {
        // 3. 更新 UI
        setInventory([...inventory, data[0] as InventoryItem]);
        setNewIngredient('');
        setNewIngredientQuantity('');
      }
    } catch (error) {
      console.error('Unexpected error adding ingredient:', error);
      alert('添加失败，请重试');
    }
  }; 
  
  const removeInventory = async (item: InventoryItem) => { 
    try {
      // 1. 从Supabase删除
      const { error } = await supabase
        .from('inventory')
        .delete()
        .eq('id', item.id);

      if (error) {
        console.error('Error removing ingredient:', error);
        alert('删除失败，请重试');
      } else {
        // 2. 更新本地状态
        setInventory(inventory.filter(i => i.id !== item.id));
      }
    } catch (error) {
      console.error('Unexpected error removing ingredient:', error);
      alert('删除失败，请重试');
    }
  }; 

  // 3. AI 生成食谱逻辑 (使用DeepSeek API) 
  const handleGenerate = async () => { 
    if (!selectedMood) return; 
    setIsGenerating(true); 
    
    try {
      // 调用DeepSeek API生成食谱，提取inventory的name字段
      const inventoryNames = inventory.map(item => item.name);
      const aiResponse = await generateRecipeFromAI(selectedMood, inventoryNames, lazyMode);
      
      // 解析AI响应，这里简化处理，实际项目中需要更复杂的解析逻辑
      // 由于AI返回的是自然语言，我们需要将其转换为结构化数据
      // 这里我们使用一个简化的mock解析，实际项目中需要更完善的解析
      const mockResult = { 
        science: selectedMood === '焦虑' 
          ? "焦虑时皮质醇升高，建议补充镁和Omega-3。深海鱼和绿叶蔬菜能缓解神经紧绷。" 
          : "低落时需要提升多巴胺。优质碳水和蛋白质结合能带来满足感，色氨酸有助于合成血清素。", 
        menu: lazyMode 
          ? [ 
              { name: "AI推荐外卖1", cal: 550, desc: aiResponse.substring(0, 50) + "...", tags: ["美团", "高蛋白"], reason: "AI推荐：" + aiResponse.substring(0, 30) + "..." }, 
              { name: "AI推荐外卖2", cal: 200, desc: aiResponse.substring(50, 100) + "...", tags: ["全家", "快手"], reason: "AI推荐：" + aiResponse.substring(30, 60) + "..." } 
            ] 
          : [ 
              { name: "AI推荐家常菜1", cal: 320, desc: `消耗库存：${inventory.filter(i => ['鸡蛋','菠菜','冻虾仁'].includes(i.name)).map(i => i.name).join('、')}。${aiResponse.substring(0, 50)}...`, tags: ["快手菜"], reason: "AI推荐：" + aiResponse.substring(0, 30) + "..." }, 
              { name: "AI推荐家常菜2", cal: 180, desc: aiResponse.substring(50, 100) + "...", tags: ["需蒸煮"], reason: "AI推荐：" + aiResponse.substring(30, 60) + "..." } 
            ] 
      }; 
      
      setGeneratedResult(mockResult); 
    } catch (error) {
      console.error('Error generating recipe:', error);
      // 生成失败时使用mock数据作为 fallback
      const mockResult = { 
        science: selectedMood === '焦虑' 
          ? "焦虑时皮质醇升高，建议补充镁和Omega-3。深海鱼和绿叶蔬菜能缓解神经紧绷。" 
          : "低落时需要提升多巴胺。优质碳水和蛋白质结合能带来满足感，色氨酸有助于合成血清素。", 
        menu: lazyMode 
          ? [ 
              { name: "轻食：炙烤三文鱼波奇饭", cal: 550, desc: "外卖搜：波奇饭", tags: ["美团", "高蛋白"], reason: "Omega-3对抗焦虑" }, 
              { name: "零食：无糖希腊酸奶碗", cal: 200, desc: "便利店可买", tags: ["全家", "快手"], reason: "益生菌调节情绪" } 
            ] 
          : [ 
              { name: "家常：虾仁滑蛋菠菜", cal: 320, desc: `消耗库存：${inventory.filter(i => ['鸡蛋','菠菜','冻虾仁'].includes(i.name)).map(i => i.name).join('、')}`, tags: ["快手菜"], reason: "菠菜富含镁" }, 
              { name: "主食：杂粮糙米饭", cal: 180, desc: "低GI主食", tags: ["需蒸煮"], reason: "平稳血糖" } 
            ] 
      }; 
      setGeneratedResult(mockResult); 
    } finally {
      setIsGenerating(false); 
    }
  }; 

  // 4. 生成周计划逻辑 (Mock) 
  const generateWeeklyPlan = () => { 
    setIsGenerating(true); 
    setTimeout(() => { 
      const days = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']; 
      const plan = days.map(day => ({ 
        day, totalCal: targetCal, 
        meals: { 
          breakfast: { name: "全麦三明治+黑咖", cal: 350, desc: "唤醒", tags: ["早餐"], reason: "提神" }, 
          lunch: { name: "香煎鸡胸肉", cal: 500, desc: "抗饿", tags: ["午餐"], reason: "饱腹" }, 
          dinner: { name: "豆腐鱼片汤", cal: 400, desc: "易消化", tags: ["晚餐"], reason: "暖身" }, 
          snack: { name: "坚果杯", cal: 150, desc: "抗氧化", tags: ["加餐"], reason: "护脑" } 
        } 
      })); 
      setWeeklyPlan(plan); 
      setIsGenerating(false); 
    }, 1200); 
  }; 

  // 5. 聊天逻辑 
  const sendMessage = () => { 
    if (!inputMsg.trim()) return; 
    const newMsg = { role: 'user', text: inputMsg }; 
    setMessages(prev => [...prev, newMsg]); 
    setInputMsg(''); 
    setTimeout(() => { 
      setMessages(prev => [...prev, { role: 'ai', text: `针对"${newMsg.text}"，建议优先选择低GI食物，保持血糖平稳。` }]); 
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); 
    }, 1000); 
  }; 

  // ========================== 
  // C. 视图渲染 (UI) 
  // ========================== 
  return ( 
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans flex flex-col"> 
      
      {/* 1. 顶部导航 */} 
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur border-b border-slate-200 shadow-sm"> 
        <div className="max-w-7xl mx-auto px-4 lg:px-8 h-16 flex justify-between items-center"> 
          <div className="flex items-center gap-2 cursor-pointer group" onClick={() => setActiveTab('home')}> 
            <div className="bg-indigo-600 p-2 rounded-lg text-white shadow-md group-hover:scale-105 transition-transform"><ChefHat size={20} /></div> 
            <span className="font-extrabold text-xl text-slate-900">MoodFood<span className="text-indigo-600">.AI</span></span> 
          </div> 
          <nav className="hidden md:flex space-x-6"> 
            {[ 
              { id: 'home', label: '心情食谱', icon: Home }, 
              { id: 'plan', label: '周期计划', icon: Calendar }, 
              { id: 'community', label: '社区', icon: Users }, 
              { id: 'progress', label: '进度数据', icon: TrendingUp }, 
            ].map((item) => ( 
              <button key={item.id} onClick={() => setActiveTab(item.id as TabType)} className={`flex items-center gap-2 px-3 py-2 text-sm font-bold rounded-lg transition-all ${activeTab === item.id ? 'text-indigo-600 bg-indigo-50' : 'text-slate-500 hover:text-slate-900'}`}> 
                <item.icon size={18} />{item.label} 
              </button> 
            ))} 
          </nav> 
          <div className="flex items-center gap-4"> 
             <div className="hidden sm:flex flex-col items-end mr-1"><span className="text-[10px] text-slate-400 font-bold uppercase">每日目标</span><span className="text-sm font-extrabold text-indigo-600">{targetCal} kcal</span></div> 
             <div className="w-9 h-9 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-700 font-bold border border-indigo-200">U</div> 
          </div> 
        </div> 
      </header> 

      {/* 2. 主内容区 */} 
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 lg:px-8 py-8"> 
        
        {/* --- TAB: 首页 --- */} 
        {activeTab === 'home' && ( 
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in"> 
            <div className="lg:col-span-5 space-y-6"> 
              {/* 身体档案 */} 
              <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm"> 
                <div className="flex justify-between items-center mb-4"><h3 className="font-bold flex gap-2"><Calculator size={18}/> 身体档案</h3><span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-bold">目标: 减脂</span></div> 
                <div className="grid grid-cols-3 gap-4 text-center"> 
                   <div className="bg-slate-50 p-2 rounded-xl"><div className="text-slate-400 text-xs font-bold">体重</div><div className="font-bold">{profile.weight}kg</div></div> 
                   <div className="bg-slate-50 p-2 rounded-xl"><div className="text-slate-400 text-xs font-bold">身高</div><div className="font-bold">{profile.height}cm</div></div> 
                   <div className="bg-indigo-50 p-2 rounded-xl"><div className="text-indigo-400 text-xs font-bold">TDEE</div><div className="font-bold text-indigo-600">{Math.round(targetCal/0.8)}</div></div> 
                </div> 
              </div> 
              {/* 冰箱库存 */} 
              <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm"> 
                <h3 className="font-bold mb-3 flex gap-2"><ShoppingBag size={18}/> 冰箱库存</h3> 
                <div className="flex flex-wrap gap-2 mb-4">
                  {isLoadingInventory ? (
                    <div className="flex items-center gap-2"><Loader2 className="animate-spin" size={16}/><span>加载中...</span></div>
                  ) : inventory.length === 0 ? (
                    <span className="text-slate-400 text-sm">暂无库存，添加一些食材吧</span>
                  ) : (
                    inventory.map(item => (
                      <span key={item.id} className="px-3 py-1 bg-slate-100 text-xs rounded-full flex gap-1 group">
                        {item.name}{item.quantity && `(${item.quantity})`}
                        <button onClick={() => removeInventory(item)} className="hover:text-red-500">
                          <X size={12}/>
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
                    placeholder="食材名称..." 
                    className="flex-1 text-sm bg-slate-50 border rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-indigo-100"
                  />
                  <input 
                    type="text" 
                    value={newIngredientQuantity} 
                    onChange={(e) => setNewIngredientQuantity(e.target.value)} 
                    placeholder="数量 (可选)..." 
                    className="w-32 text-sm bg-slate-50 border rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-indigo-100"
                  />
                  <button 
                    onClick={addInventory} 
                    className="bg-slate-800 text-white p-2 rounded-xl hover:bg-slate-700 transition-colors"
                  >
                    <Plus size={20}/>
                  </button>
                </div> 
              </div> 
              {/* 生成控制台 */} 
              <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-lg"> 
                <h2 className="text-2xl font-extrabold mb-2">此刻心情如何？</h2> 
                <div className="bg-slate-100 p-1 rounded-xl flex mb-6"><button onClick={() => setLazyMode(false)} className={`flex-1 py-2 rounded-lg text-sm font-bold ${!lazyMode ? 'bg-white shadow text-indigo-600' : 'text-slate-400'}`}>自己做</button><button onClick={() => setLazyMode(true)} className={`flex-1 py-2 rounded-lg text-sm font-bold ${lazyMode ? 'bg-white shadow text-orange-500' : 'text-slate-400'}`}>点外卖</button></div> 
                <div className="grid grid-cols-3 gap-3 mb-6">{MOOD_OPTIONS.map((mood) => (<button key={mood.label} onClick={() => setSelectedMood(mood.label as MoodType)} className={`flex flex-col items-center p-3 rounded-xl border-2 ${selectedMood === mood.label ? mood.color : 'bg-slate-50 border-transparent'}`}>{mood.icon}<span className="text-xs font-bold mt-2">{mood.label}</span></button>))}</div> 
                <button onClick={handleGenerate} disabled={isGenerating || !selectedMood} className={`w-full py-4 rounded-xl font-bold text-white shadow-xl flex justify-center gap-2 ${lazyMode ? 'bg-orange-500' : 'bg-indigo-600'}`}>{isGenerating ? <Loader2 className="animate-spin" /> : <Sparkles size={20} />} 生成治愈菜单</button> 
              </div> 
            </div> 
            {/* 右侧结果 */} 
            <div className="lg:col-span-7 flex flex-col gap-6"> 
              {generatedResult ? ( 
                <div className="animate-in slide-in-from-right-8 space-y-6"> 
                   <div className="bg-indigo-50 border border-indigo-100 p-6 rounded-3xl flex gap-4"><div className="bg-white p-3 rounded-2xl h-fit text-indigo-600"><Brain size={24}/></div><div><h4 className="font-bold text-indigo-900 mb-1">AI 营养分析</h4><p className="text-sm text-indigo-900/70">{generatedResult.science}</p></div></div> 
                   <div className="grid gap-4">{generatedResult.menu.map((item: any, i: number) => (<div key={i} className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 hover:shadow-lg transition-all group relative overflow-hidden"><div className="relative z-10 flex justify-between"><div className="flex-1 pr-4"><div className="flex items-center gap-3 mb-2"><span className="text-[10px] font-bold px-2 py-1 rounded border uppercase bg-indigo-50 text-indigo-600">{item.tags[0]}</span><h4 className="font-bold text-xl">{item.name}</h4></div><p className="text-sm text-slate-500 mb-3">{item.desc}</p><div className="flex items-center gap-1.5 text-xs text-indigo-600 bg-indigo-50 w-fit px-3 py-1.5 rounded-lg"><Sparkles size={14}/> 推荐理由：{item.reason}</div></div><div className="text-2xl font-extrabold">{item.cal}<span className="text-xs font-normal text-slate-400">kcal</span></div></div><div className="mt-6 pt-4 border-t border-slate-50 flex justify-between opacity-80"><button className="text-slate-400 hover:text-red-500"><Heart size={20}/></button><button className="text-sm font-bold text-indigo-600 flex items-center gap-1">{lazyMode ? '去点餐' : '查看做法'} <ArrowRight size={16}/></button></div></div>))}</div> 
                </div> 
              ) : ( 
                <div className="h-full bg-white/50 border-2 border-dashed border-slate-200 rounded-3xl flex flex-col items-center justify-center text-slate-400 min-h-[500px]"><div className="bg-slate-100 p-6 rounded-full mb-4"><Utensils size={40} /></div><p>等待 AI 投喂中...</p></div> 
              )} 
            </div> 
          </div> 
        )} 

        {/* --- TAB: 计划 --- */} 
        {activeTab === 'plan' && ( 
          <div className="space-y-6 animate-in fade-in"> 
             <div className="flex justify-between items-end"><h2 className="text-2xl font-bold">本周饮食计划</h2><button onClick={generateWeeklyPlan} className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-md flex items-center gap-2">{isGenerating ? <Loader2 className="animate-spin" size={16}/> : <Sparkles size={16}/>} 重新生成</button></div> 
             {weeklyPlan.length > 0 ? ( 
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-4">{weeklyPlan.map((day, i) => (<div key={i} className="bg-white rounded-2xl border border-slate-200 overflow-hidden flex flex-col hover:shadow-md transition-all"><div className="bg-slate-50 p-3 border-b text-center font-bold text-slate-700">{day.day}</div><div className="p-3 space-y-4 flex-1 text-sm">{['breakfast','lunch','dinner'].map(t=>(<div key={t}><span className="text-[10px] text-slate-400 font-bold uppercase">{t}</span><p className="font-medium truncate">{day.meals[t as keyof typeof day.meals].name}</p><span className="text-[10px] text-slate-400">{day.meals[t as keyof typeof day.meals].cal} kcal</span></div>))}</div><div className="p-2 bg-slate-50 border-t text-center text-xs font-bold text-slate-500">Total: {day.meals.breakfast.cal+day.meals.lunch.cal+day.meals.dinner.cal}</div></div>))}</div> 
             ) : (<div className="text-center py-24 bg-white rounded-3xl border-2 border-dashed"><Calendar size={64} className="mx-auto text-slate-200 mb-6"/><h3 className="text-lg font-bold text-slate-700">暂无计划</h3><button onClick={generateWeeklyPlan} className="text-indigo-600 font-bold hover:underline">点击生成</button></div>)}
          </div> 
        )} 

        {/* --- TAB: 社区 --- */} 
        {activeTab === 'community' && ( 
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in">{COMMUNITY_POSTS.map(post => (<div key={post.id} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-lg cursor-pointer"><div className="flex justify-between mb-4"><div className="flex items-center gap-2"><div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">{post.avatar}</div><span className="font-bold text-sm">{post.user}</span></div><span className="text-xs bg-indigo-50 text-indigo-600 px-2 py-1 rounded">#{post.mood}</span></div><h3 className="font-bold text-lg mb-2">{post.title}</h3><p className="text-sm text-slate-600 mb-4">{post.desc}</p><div className="flex justify-between text-xs text-slate-400 pt-4 border-t"><div className="flex gap-2">{post.tags.map(t=><span key={t} className="bg-slate-100 px-1.5 py-0.5 rounded">{t}</span>)}</div><div className="flex items-center gap-1"><Heart size={14}/> {post.likes}</div></div></div>))}</div> 
        )} 

        {/* --- TAB: 进度 --- */} 
        {activeTab === 'progress' && ( 
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-slate-100 shadow-sm animate-in fade-in"><TrendingUp size={48} className="text-indigo-500 mb-6"/><h2 className="text-2xl font-bold mb-2">数据可视化看板</h2><p className="text-slate-500 mb-6">此处将集成图表库展示体重与营养趋势</p></div> 
        )} 
      </main> 

      {/* 3. AI 聊天悬浮窗 */} 
      <div className="fixed bottom-8 right-8 z-50 flex flex-col items-end"> 
        {showChat && ( 
          <div className="bg-white w-80 sm:w-96 h-[500px] rounded-2xl shadow-2xl border border-slate-200 flex flex-col mb-4 overflow-hidden animate-in slide-in-from-bottom-5"> 
            <div className="bg-slate-900 p-4 text-white flex justify-between items-center"><div className="flex items-center gap-2"><Brain size={16}/><span className="font-bold text-sm">MoodFood AI</span></div><button onClick={() => setShowChat(false)}><X size={18}/></button></div> 
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">{messages.map((msg, idx) => (<div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}><div className={`max-w-[85%] p-3 rounded-2xl text-sm ${msg.role === 'user' ? 'bg-indigo-600 text-white' : 'bg-white border'}`}>{msg.text}</div></div>))}<div ref={chatEndRef} /></div> 
            <div className="p-3 bg-white border-t relative"><input type="text" value={inputMsg} onChange={(e) => setInputMsg(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && sendMessage()} placeholder="输入问题..." className="w-full bg-slate-100 rounded-xl py-3 pl-4 pr-12 text-sm outline-none"/><button onClick={sendMessage} className="absolute right-5 top-1/2 -translate-y-1/2"><Send size={16} className="text-indigo-600"/></button></div> 
          </div> 
        )} 
        <button onClick={() => setShowChat(!showChat)} className="bg-indigo-600 text-white p-4 rounded-full shadow-xl hover:scale-110 transition-all flex items-center gap-2 group"><MessageCircle size={24} />{!showChat && <span className="font-bold pr-2 hidden md:block max-w-0 overflow-hidden group-hover:max-w-[100px] transition-all">咨询</span>}</button> 
      </div> 
    </div> 
  ); 
}