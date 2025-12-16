// lib/deepseek/client.ts 
 import axios from 'axios'; 
 import { UserProfile } from '../../app/shared'; 
 
 export interface DeepSeekMessage { 
   role: 'system' | 'user' | 'assistant'; 
   content: string; 
 } 
 
 async function chatWithDeepSeek(messages: DeepSeekMessage[]): Promise<string> { 
  try { 
    const response = await axios.post('/api/deepseek', { messages }); 
    
    // 🔴 修复前 (原来的错误写法): 
    // return response.data.content; 
    
    // 🟢 修复后 (正确的 DeepSeek/OpenAI 响应结构): 
    const aiContent = response.data.choices?.[0]?.message?.content; 
    
    if (!aiContent) { 
      console.error('AI Response Structure:', response.data); // 方便调试 
      throw new Error('Invalid response from AI provider'); 
    } 

    return aiContent; 
  } catch (error) { 
    console.error('DeepSeek API Error:', error); 
    throw new Error('Failed to fetch from DeepSeek'); 
  } 
 } 
 
 /** 
  * 核心修改：增加了 locale 参数 
  */ 
 export async function generateRecipe( 
   mood: string, 
   inventory: string[], 
   lazyMode: boolean, 
   locale: 'zh' | 'en' // <--- 新增 
 ): Promise<string> { 
   
   // 根据语言选择提示词 
   const langPrompt = locale === 'zh' 
     ? '请使用中文回复。' 
     : 'Please answer STRICTLY in English.'; 
 
   const systemPrompt = `You are a professional nutritionist and chef. 
   ${langPrompt} 
   Based on the user's mood and inventory, recommend 3 recipes. 
   
   【Format Rule】 
   1. Return ONLY a valid JSON object. No markdown, no extra text. 
   2. Structure: 
   { 
     "science": "Short explanation...", 
     "menu": [ 
       { 
         "name": "Dish Name", 
         "desc": "Short description", 
         "reason": "Why it fits", 
         "cal": 500, 
         "tags": ["Tag1"], 
         "recipe_detail": "Detailed cooking steps..." 
       } 
     ] 
   }`; 
 
   const userPrompt = ` 
   Current Mood: ${mood} 
   Inventory: ${inventory.length > 0 ? inventory.join(', ') : 'None'} 
   Preference: ${lazyMode ? 'Delivery' : 'Cooking'} 
   `; 
 
   return chatWithDeepSeek([ 
     { role: 'system', content: systemPrompt }, 
     { role: 'user', content: userPrompt }, 
   ]); 
 } 
 
 /** 
  * 核心修改：增加了 locale 参数 
  */ 
 export async function generateWeeklyPlan( 
   profile: UserProfile, 
   locale: 'zh' | 'en' // <--- 新增 
 ): Promise<string> { 
 
   const langPrompt = locale === 'zh' 
     ? '请使用中文回复。' 
     : 'Please answer STRICTLY in English.'; 
 
   const systemPrompt = `You are a fitness planner. 
   ${langPrompt} 
   Generate a 7-day plan. 
 
   【Format Rule】 
   1. Return ONLY a valid JSON object. 
   2. Structure: 
   { 
     "summary": "Advice...", 
     "schedule": [ { "day": "Monday", "focus": "...", "meals": {...}, "exercise": "..." } ] 
   }`; 
 
   const userPrompt = `Profile: ${JSON.stringify(profile)}`; 
 
   return chatWithDeepSeek([ 
     { role: 'system', content: systemPrompt }, 
     { role: 'user', content: userPrompt }, 
   ]); 
 }