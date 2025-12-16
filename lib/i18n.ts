// lib/i18n.ts

export type Locale = 'zh' | 'en';

export const translations = {
  zh: {
    // 通用
    appName: 'MoodFood.AI',
    login: '登录',
    register: '注册',
    logout: '退出登录',
    loading: '加载中...',
    save: '保存',
    saving: '保存中...',
    
    // 导航
    dailyTarget: '每日目标',
    home: '心情食谱',
    plan: '周期计划',
    community: '社区',
    progress: '进度数据',
    
    // 首页 - 身体档案
    bodyProfile: '身体档案',
    weight: '体重',
    height: '身高',
    age: '年龄',
    gender: '性别',
    goal: '目标',
    female: '女',
    male: '男',
    lose: '减脂',
    maintain: '保持',
    gain: '增肌',
    loginToEdit: '登录后可编辑',
    
    // 首页 - 冰箱库存
    fridgeInventory: '冰箱库存',
    inventoryEmpty: '空空如也，加点什么吧',
    ingredientName: '食材名称...',
    quantity: '数量',
    loginToManage: '登录后管理库存',
    
    // 首页 - 生成器
    moodQuestion: '此刻心情如何？',
    cooking: '自己做',
    delivery: '点外卖',
    generateBtn: '生成治愈菜单',
    generating: 'AI 正在思考...',
    aiAnalysis: 'AI 情绪营养分析',
    recommendReason: '推荐理由',
    viewRecipe: '查看详细做法',
    searchDelivery: '去美团搜索',
    waitingForAi: '选择心情，等待 AI 投喂...',
    
    // 登录页
    emailLogin: '邮箱验证码登录',
    registerAccount: '注册新账号',
    passwordLogin: '账号密码登录',
    passwordMode: '密码模式',
    otpMode: '免密验证码',
    emailLabel: '邮箱地址',
    emailPlaceholder: '例如：123456@qq.com',
    passwordLabel: '密码',
    passwordPlaceholder: '请输入密码',
    setPasswordPlaceholder: '设置您的登录密码',
    sendLink: '发送验证链接',
    retryAfter: '秒后重试',
    processing: '处理中...',
    loginNow: '登录',
    registerNow: '立即注册',
    noAccount: '还没有账号？',
    hasAccount: '已有账号？',
    toRegister: '去注册',
    toLogin: '去登录',
    otpNote: '* 验证码登录模式下，未注册邮箱将自动创建账号',
    
    // 反馈消息
    emailSent: '验证邮件已发送！请查收邮箱。',
    registerSuccess: '注册成功！请前往邮箱确认验证链接。',
    loginSuccess: '注册并登录成功！正在跳转...',
    operationFailed: '操作失败，请重试',
  },
  en: {
    // General
    appName: 'MoodFood.AI',
    login: 'Login',
    register: 'Register',
    logout: 'Logout',
    loading: 'Loading...',
    save: 'Save',
    saving: 'Saving...',
    
    // Nav
    dailyTarget: 'Daily Target',
    home: 'Recipes',
    plan: 'Plan',
    community: 'Community',
    progress: 'Progress',
    
    // Home - Profile
    bodyProfile: 'Body Profile',
    weight: 'Weight',
    height: 'Height',
    age: 'Age',
    gender: 'Gender',
    goal: 'Goal',
    female: 'Female',
    male: 'Male',
    lose: 'Lose Weight',
    maintain: 'Maintain',
    gain: 'Gain Muscle',
    loginToEdit: 'Login to edit',
    
    // Home - Inventory
    fridgeInventory: 'Fridge Inventory',
    inventoryEmpty: 'Empty, add something!',
    ingredientName: 'Ingredient...',
    quantity: 'Qty',
    loginToManage: 'Login to manage',
    
    // Home - Generator
    moodQuestion: 'How do you feel?',
    cooking: 'Cook',
    delivery: 'Delivery',
    generateBtn: 'Generate Menu',
    generating: 'AI is thinking...',
    aiAnalysis: 'AI Mood Analysis',
    recommendReason: 'Reason',
    viewRecipe: 'View Recipe',
    searchDelivery: 'Search App',
    waitingForAi: 'Select mood, waiting for AI...',
    
    // Auth Page
    emailLogin: 'Email OTP Login',
    registerAccount: 'Create Account',
    passwordLogin: 'Password Login',
    passwordMode: 'Password',
    otpMode: 'OTP Code',
    emailLabel: 'Email Address',
    emailPlaceholder: 'e.g., name@example.com',
    passwordLabel: 'Password',
    passwordPlaceholder: 'Enter password',
    setPasswordPlaceholder: 'Set your password',
    sendLink: 'Send Link',
    retryAfter: 's retry',
    processing: 'Processing...',
    loginNow: 'Login',
    registerNow: 'Register',
    noAccount: 'No account?',
    hasAccount: 'Has account?',
    toRegister: 'Sign up',
    toLogin: 'Sign in',
    otpNote: '* Account will be auto-created if email not found',
    
    // Messages
    emailSent: 'Verification email sent! Please check your inbox.',
    registerSuccess: 'Success! Please confirm your email.',
    loginSuccess: 'Logged in! Redirecting...',
    operationFailed: 'Operation failed, please try again',
  }
};