// lib/deepseek/client.ts
import axios from 'axios';
import { UserProfile } from '../../app/shared'; // 确保引入路径正确

// 定义消息类型
interface DeepSeekMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

/**
 * 核心聊天函数 - 改为调用 Next.js 内部 API
 */
export async function chatWithDeepSeek(messages: DeepSeekMessage[], model: string = 'deepseek-chat'): Promise<string> {
  try {
    // 修改点：请求地址改为本项目内部 API '/api/deepseek'
    // 不再需要 Authorization 头，因为那是后端的事
    const response = await axios.post('/api/deepseek', {
      model,
      messages,
      temperature: 0.7,
      max_tokens: 1500,
      response_format: { type: 'json_object' } // 尝试强制 JSON
    });

    // 容错处理：确保返回结构正确
    if (!response.data?.choices?.[0]?.message?.content) {
      throw new Error('Invalid response structure from AI API');
    }

    return response.data.choices[0].message.content;
  } catch (error) {
    console.error('Client Chat Error:', error);
    throw error;
  }
}

/**
 * 生成食谱业务逻辑
 */
export async function generateRecipe(mood: string, inventory: string[], isLazyMode: boolean): Promise<string> {
  // 定义严格的 JSON 结构要求
  const systemPrompt = `你是一个专业的情绪营养师。请根据用户心情和食材生成推荐。
   
  【重要规则】
  1. 必须严格仅返回一个合法的 JSON 对象。
  2. 不要包含任何 markdown 格式（如 \`\`\`json ），不要包含任何额外的文字前缀或后缀。
  3. JSON 结构必须严格如下：
  {
    "science": "一句话科学分析（如：焦虑时皮质醇升高，建议补充...）",
    "menu": [
      {
        "name": "菜名",
        "cal": 300,
        "desc": "简短描述（如果是在家做，需包含如何使用库存食材）",
        "tags": ["标签1", "标签2"],
        "reason": "为什么这道菜适合当前心情"
      },
      {
        "name": "菜名2",
        "cal": 400,
        "desc": "...",
        "tags": ["..."],
        "reason": "..."
      }
    ]
  }
  `;

  const userPrompt = `我的心情是：${mood}
  我的冰箱库存有：${inventory.length > 0 ? inventory.join('、') : '无（需要购买）'}
  模式：${isLazyMode ? '点外卖（推荐适合该心情的外卖选项）' : '自己做（优先消耗库存，步骤简单）'}`;

  const messages: DeepSeekMessage[] = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt },
  ];

  return chatWithDeepSeek(messages);
}

/**
 * 新增：生成周计划业务逻辑
 */
export async function generateWeeklyPlan(profile: UserProfile): Promise<string> {
  const systemPrompt = `你是一个专业的健身与饮食规划师。请根据用户的身体档案生成一周(7天)的饮食与运动计划。

  【重要规则】
  1. 必须严格仅返回一个合法的 JSON 对象。
  2. 不要包含 markdown 格式，不要包含额外文字。
  3. JSON 结构必须严格如下：
  {
    "summary": "根据用户BMI(${calculateBMI(profile)})和目标(${profile.goal})生成的整体建议...",
    "schedule": [
      {
        "day": "周一",
        "focus": "简短关键词",
        "meals": { "breakfast": "...", "lunch": "...", "dinner": "..." },
        "exercise": "..."
      },
      ... (共7天)
    ]
  }`;

  const userPrompt = `我的档案：
  性别：${profile.gender}
  年龄：${profile.age}
  身高：${profile.height}cm
  体重：${profile.weight}kg
  目标：${profile.goal === 'lose' ? '减脂' : profile.goal === 'gain' ? '增肌' : '保持健康'}
  活动量系数：${profile.activity}`;

  const messages: { role: 'system' | 'user'; content: string }[] = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt },
  ];

  return chatWithDeepSeek(messages);
}

// 辅助函数：简单的BMI计算用于Prompt中
function calculateBMI(p: UserProfile) {
  if (!p.height || !p.weight) return '未知';
  const h = p.height / 100;
  return (p.weight / (h * h)).toFixed(1);
}