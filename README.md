# MoodFood.AI - 情绪化饮食健康助手

MoodFood.AI 是一款基于 AI 的情绪化饮食健康管理应用，帮助用户根据当前心情状态获得个性化的饮食推荐和一周健康计划。项目采用 Next.js 14 全栈架构，自托管部署，数据完全可控。

## 核心功能

**情绪食谱生成** - 基于 AI 大模型，结合用户当前情绪和冰箱现有食材，智能推荐 3 道治愈菜品。支持"自己做"和"点外卖"两种模式，每道菜附带营养科学解读和详细烹饪步骤。

**身体档案管理** - 记录身高、体重、年龄、运动习惯等数据，自动计算 BMI 并给出健康目标建议。档案数据作为 AI 生成周计划的输入依据。

**冰箱库存管理** - 添加和管理冰箱中的食材清单，生成食谱时优先使用已有食材，减少浪费。

**一周健康计划** - 根据用户身体状况和目标（减重/增肌/维持），生成包含每日饮食安排和运动建议的 7 天计划。

**用户认证系统** - 邮箱注册 + QQ SMTP 验证码 + JWT 鉴权，密码使用 bcrypt 加密存储。

**中英文双语** - 完整的多语言支持，根据浏览器语言自动检测，界面和 AI 生成内容均可切换语言。

## 技术架构

| 层级 | 技术选型 |
|------|---------|
| 前端框架 | Next.js 14 (App Router) + React 18 + TypeScript |
| UI | Tailwind CSS + Lucide React Icons |
| AI 引擎 | Mimo API (mimo-v2.5-pro) |
| 数据库 | SQLite (better-sqlite3, WAL 模式) |
| 认证 | JWT (jose) + bcryptjs 密码哈希 |
| 邮件服务 | QQ SMTP (nodemailer) |
| 进程管理 | PM2 |
| 反向代理 | OpenResty (Nginx) |
| 部署 | Linux 服务器自托管 (standalone 模式) |

## 项目结构

```
mood-food-web/
├── app/
│   ├── api/
│   │   ├── auth/          # 注册、登录、登出、验证码、用户信息
│   │   ├── deepseek/      # AI API 代理 (Mimo)
│   │   ├── inventory/     # 冰箱食材 CRUD
│   │   └── profile/       # 用户档案读写
│   ├── auth/
│   │   ├── signin/        # 登录页面
│   │   └── signup/        # 注册页面 (邮箱验证码)
│   ├── page.tsx           # 主应用页面
│   ├── layout.tsx         # 根布局
│   └── globals.css        # 全局样式
├── lib/
│   ├── auth.ts            # JWT 工具函数
│   ├── db.ts              # SQLite 数据库初始化与连接
│   ├── email.ts           # QQ SMTP 邮件发送
│   ├── i18n.ts            # 国际化翻译字典
│   └── deepseek/
│       └── client.ts      # AI 调用客户端
├── public/                # 静态资源
├── .env.example           # 环境变量示例
├── ecosystem.config.example.js  # PM2 配置示例
└── next.config.js         # Next.js 配置
```

## 本地开发

### 前置要求

- Node.js >= 18
- npm >= 9

### 安装步骤

1. 克隆项目并安装依赖：

```bash
git clone https://github.com/1786329860/mood-food-web.git
cd mood-food-web
npm install
```

2. 配置环境变量：

```bash
cp .env.example .env
```

编辑 `.env` 文件，填入你的 API 密钥和邮箱配置。

3. 启动开发服务器：

```bash
npm run dev
```

访问 http://localhost:3000 即可使用。

## 生产部署

### 构建

```bash
npm run build
```

项目使用 `output: 'standalone'` 模式，构建产物在 `.next/standalone/` 目录。

### 使用 PM2 部署

1. 将 standalone 产物复制到部署目录
2. 复制 `.env.example` 到部署目录并重命名为 `.env`，填入实际配置
3. 复制 `ecosystem.config.example.js` 并重命名为 `ecosystem.config.js`，修改路径和端口
4. 启动服务：

```bash
pm2 start ecosystem.config.js
```

### Nginx 反向代理

建议配置较长的 `proxy_read_timeout`（如 300s），因为 AI 食谱生成需要等待大模型响应。

## 环境变量说明

| 变量名 | 说明 | 必填 |
|--------|------|------|
| `MIMO_API_KEY` | Mimo API 密钥 | 是 |
| `QQ_EMAIL_USER` | QQ 邮箱地址 (用于发送验证码) | 是 |
| `QQ_EMAIL_AUTH_CODE` | QQ 邮箱 SMTP 授权码 | 是 |
| `JWT_SECRET` | JWT 签名密钥 (建议使用随机字符串) | 是 |
| `DB_PATH` | SQLite 数据库文件路径 | 否 (默认 `./data/moodfood.db`) |
| `NEXT_PUBLIC_APP_URL` | 应用公开访问地址 | 否 |

## 许可证

MIT
