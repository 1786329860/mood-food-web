import axios from 'axios';

// 创建DeepSeek API客户端
const deepseekClient = axios.create({
  baseURL: 'https://api.deepseek.com/v1',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`,
  },
});

interface DeepSeekMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface DeepSeekChatRequest {
  model: string;
  messages: DeepSeekMessage[];
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
}

interface DeepSeekChatResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: {
    index: number;
    message: DeepSeekMessage;
    finish_reason: string;
  }[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

/**
 * 调用DeepSeek API进行聊天
 * @param messages 消息历史
 * @param model 使用的模型，默认为deepseek-chat
 * @returns AI回复的内容
 */
export async function chatWithDeepSeek(
  messages: DeepSeekMessage[],
  model: string = 'deepseek-chat'
): Promise<string> {
  try {
    const requestData: DeepSeekChatRequest = {
      model,
      messages,
      temperature: 0.7,
      max_tokens: 1000,
    };

    const response = await deepseekClient.post<DeepSeekChatResponse>('/chat/completions', requestData);
    return response.data.choices[0].message.content;
  } catch (error) {
    console.error('Error calling DeepSeek API:', error);
    throw error;
  }
}

/**
 * 生成食谱推荐
 * @param mood 用户当前心情
 * @param inventory 冰箱库存
 * @param isLazyMode 是否为懒模式（点外卖）
 * @returns 食谱推荐结果
 */
export async function generateRecipe(
  mood: string,
  inventory: string[],
  isLazyMode: boolean
): Promise<string> {
  const systemPrompt = `你是一个专业的情绪营养师，根据用户的心情和冰箱库存，为用户推荐合适的食谱。

规则：
1. 考虑用户当前的心情，推荐能改善情绪的食物
2. 优先使用冰箱中的库存食材
3. 根据是否为懒模式（点外卖）生成不同类型的推荐
4. 推荐内容要包含食谱名称、卡路里、描述、标签和推荐理由
5. 输出格式要清晰易读
6. 使用中文回答`;

  const userPrompt = `我的心情是：${mood}
我的冰箱库存有：${inventory.join('、')}
我现在${isLazyMode ? '想点外卖' : '想自己做饭'}
请为我推荐合适的食谱。`;

  const messages: DeepSeekMessage[] = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt },
  ];

  return chatWithDeepSeek(messages);
}