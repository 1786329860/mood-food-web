import type { Metadata, Viewport } from 'next'

export const metadata: Metadata = {
  title: '情绪饮食健康助手',
  description: '根据情绪推荐适合的饮食方案',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'MoodFood.AI',
    startupImage: '/icons/icon-512x512.png',
  },
  manifest: '/manifest.json',
}

export const viewport: Viewport = {
  themeColor: '#6366f1',
}