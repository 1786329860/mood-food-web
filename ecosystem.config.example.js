/**
 * PM2 Ecosystem Configuration Example
 *
 * Copy this file to ecosystem.config.js and fill in your own values.
 * ecosystem.config.js is gitignored and should NEVER be committed.
 */
module.exports = {
  apps: [
    {
      name: 'moodfood',
      script: 'server.js',
      cwd: '/opt/sites/moodfood', // Change to your deployment path
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'production',
        PORT: 3001,
        HOSTNAME: '127.0.0.1',
        MIMO_API_KEY: 'your-mimo-api-key-here',
        QQ_EMAIL_USER: 'your-qq-email@qq.com',
        QQ_EMAIL_AUTH_CODE: 'your-qq-smtp-auth-code',
        JWT_SECRET: 'generate-a-random-string-here',
        DB_PATH: '/opt/sites/moodfood/data/moodfood.db',
        NEXT_PUBLIC_APP_NAME: 'MoodFood.AI',
        NEXT_PUBLIC_APP_SHORT_NAME: 'MoodFood',
        NEXT_PUBLIC_APP_DESCRIPTION: '情绪饮食健康助手',
        NEXT_PUBLIC_APP_URL: 'https://your-domain.com',
      },
    },
  ],
};
