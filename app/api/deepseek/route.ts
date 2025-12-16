// app/api/deepseek/route.ts
import { NextResponse } from 'next/server';
import axios from 'axios';

// 强制动态模式，防止静态缓存
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    // 1. 验证 API Key 是否存在 (服务器端可以读取)
    const apiKey = process.env.DEEPSEEK_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Server configuration error: Missing API Key' },
        { status: 500 }
      );
    }

    // 2. 获取前端传来的参数
    const { messages, model, max_tokens, temperature, response_format } = await request.json();

    // 3. 服务端向 DeepSeek 发起请求
    const response = await axios.post(
      'https://api.deepseek.com/v1/chat/completions',
      {
        model: model || 'deepseek-chat',
        messages,
        temperature: temperature ?? 0.7,
        max_tokens: max_tokens ?? 2000,
        response_format,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        timeout: 60000,
      }
    );

    // 4. 返回 DeepSeek 的结果给前端
    return NextResponse.json(response.data);

  } catch (error: any) {
    console.error('DeepSeek API Proxy Error:', error.response?.data || error.message);
    
    // 返回友好的错误信息
    return NextResponse.json(
      { 
        error: 'AI Service Unavailable', 
        details: error.response?.data?.error?.message || error.message 
      },
      { status: error.response?.status || 500 }
    );
  }
}