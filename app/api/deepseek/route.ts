import { NextResponse } from 'next/server';
import axios from 'axios';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const apiKey = process.env.MIMO_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Server configuration error: Missing API Key' },
        { status: 500 }
      );
    }

    const { messages, max_tokens, temperature } = await request.json();

    const response = await axios.post(
      'https://token-plan-cn.xiaomimimo.com/v1/chat/completions',
      {
        model: 'mimo-v2.5-pro',
        messages,
        temperature: temperature ?? 0.7,
        max_completion_tokens: max_tokens ?? 2000,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'api-key': apiKey,
        },
        timeout: 300000,
      }
    );

    return NextResponse.json(response.data);
  } catch (error: any) {
    console.error('Mimo API Proxy Error:', error.response?.data || error.message);
    return NextResponse.json(
      {
        error: 'AI Service Unavailable',
        details: error.response?.data?.error?.message || error.message,
      },
      { status: error.response?.status || 500 }
    );
  }
}
