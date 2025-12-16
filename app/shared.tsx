import React from 'react'; 
import { 
  CloudRain, Battery, Heart, Coffee, Zap 
} from 'lucide-react'; 

// ========================================== 
// 1. 类型定义 (TypeScript Interfaces) 
// ========================================== 

export type TabType = 'home' | 'plan' | 'community' | 'progress'; 
export type MoodType = '焦虑' | '疲惫' | '开心' | '低落' | '压力大'; 

// 对应数据库: profiles 表 
export interface UserProfile { 
  id?: string; // UUID 
  age: number; 
  height: number; // cm 
  weight: number; // kg 
  gender: 'male' | 'female'; 
  activity: number; // 活动系数 (1.2 - 1.9) 
  goal: 'lose' | 'maintain' | 'gain'; // 减脂/维持/增肌 
  username?: string; 
  avatar_url?: string; 
} 

// 对应数据库: inventory 表 
export interface InventoryItem { 
  id: string; 
  user_id: string; 
  name: string; 
  quantity?: string; 
} 

// 对应数据库: mood_logs 表 
export interface MoodLog { 
  id: string; 
  user_id: string; 
  mood: string; 
  note?: string; 
  created_at: string; 
} 

// 对应数据库: community_posts 表 
export interface Post { 
  id: number | string; 
  user_id?: string; 
  user: string; // 关联查询 profiles.username 
  avatar: string; // 关联查询 profiles.avatar_url 
  title: string; 
  desc: string; 
  mood: string; 
  likes: number; 
  tags: string[]; 
  image_url?: string; 
} 

export interface FoodItem { 
  name: string; 
  cal: number; 
  desc: string; 
  tags: string[]; 
  reason?: string; // AI推荐理由 
} 

export interface DayPlan {
  day: string;
  totalCal: number;
  meals: {
    breakfast: FoodItem;
    lunch: FoodItem;
    dinner: FoodItem;
    snack: FoodItem;
  };
}

// --- 新增：周计划相关类型 ---
export interface WeeklyDayPlan {
  day: string; // "周一", "周二"...
  focus: string; // 当日重点 (如：高碳水日 / 休息日)
  meals: {
    breakfast: string;
    lunch: string;
    dinner: string;
  };
  exercise: string; // 建议运动
}

export interface WeeklyPlanResult {
  summary: string; // 整体计划概述
  schedule: WeeklyDayPlan[]; // 7天计划
} 

// ========================================== 
// 2. 静态数据与配置 (Constants) 
// ========================================== 

// 情绪选项配置 (包含图标颜色和组件) 
export const MOOD_OPTIONS = [ 
  { id: 'mood_anxious', label: '焦虑', icon: <CloudRain size={24} />, color: 'bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100' }, 
  { id: 'mood_tired', label: '疲惫', icon: <Battery size={24} />, color: 'bg-yellow-50 text-yellow-600 border-yellow-200 hover:bg-yellow-100' }, 
  { id: 'mood_happy', label: '开心', icon: <Heart size={24} />, color: 'bg-pink-50 text-pink-600 border-pink-200 hover:bg-pink-100' }, 
  { id: 'mood_sad', label: '低落', icon: <Coffee size={24} />, color: 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100' }, 
  { id: 'mood_stressed', label: '压力大', icon: <Zap size={24} />, color: 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100' }, 
]; 

// 模拟社区帖子数据 
export const COMMUNITY_POSTS = [ 
  { id: 1, user: "低卡小厨娘", avatar: "👩🏻‍🍳", title: "压力大时的神仙外卖改版！", desc: "点了麻辣烫但只喝汤不吃面，加了一份魔芋丝，感觉人生被治愈了...", mood: "压力大", likes: 128, tags: ["外卖改造"] }, 
  { id: 2, user: "健身狂魔", avatar: "💪", title: "便利店增肌组合", desc: "全家鸡胸肉+温泉蛋+即食玉米，这搭配绝了，不到20块搞定一顿高蛋白午餐。", mood: "开心", likes: 85, tags: ["便利店"] }, 
  { id: 3, user: "加班狗", avatar: "🐶", title: "深夜emo时刻", desc: "按照AI推荐喝了热牛奶加一点肉桂粉，真的好睡很多。", mood: "低落", likes: 24, tags: ["助眠"] }, 
  { id: 4, user: "甜食控", avatar: "🍰", title: "自制低卡提拉米苏", desc: "用希腊酸奶代替马斯卡彭奶酪，热量直接砍半！", mood: "开心", likes: 230, tags: ["甜品"] }, 
];