import axios from 'axios';

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

export async function chatWithDeepSeek(messages: DeepSeekMessage[], model: string = 'deepseek-chat'): Promise<string> {
  try {
    const response = await deepseekClient.post('/chat/completions', {
      model,
      messages,
      temperature: 0.7,
      max_tokens: 1500, // 增加 token 数以容纳完整 JSON
      response_format: { type: 'json_object' } // 关键：强制启用 JSON 模式 (如果 DeepSeek 模型支持)
    });
    return response.data.choices[0].message.content;
  } catch (error) {
    console.error('DeepSeek API Error:', error);
    throw error;
  }
}

export async function generateRecipe(mood: string, inventory: string[], isLazyMode: boolean): Promise<string> {
  // 定义严格的 JSON 结构要求
  const systemPrompt = `你是一个专业的情绪营养师。请根据用户心情和食材生成推荐。
   
  必须严格仅返回一个合法的 JSON 对象，不要包含任何 markdown 格式或额外文字。JSON 结构如下：
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

  // 这里不写死 response_format，因为有些 DeepSeek 版本可能不支持标准 JSON Mode 参数，
  // 但我们在 System Prompt 里强约束了。
  return chatWithDeepSeek(messages);
}