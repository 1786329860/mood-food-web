import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: 'smtp.qq.com',
  port: 465,
  secure: true,
  auth: {
    user: process.env.QQ_EMAIL_USER,
    pass: process.env.QQ_EMAIL_AUTH_CODE,
  },
});

const SENDER = `"MoodFood.AI" <${process.env.QQ_EMAIL_USER}>`;

/**
 * Send a verification code email via QQ SMTP
 */
export async function sendVerificationCode(email: string, code: string): Promise<void> {
  await transporter.sendMail({
    from: SENDER,
    to: email,
    subject: 'MoodFood.AI 注册验证码',
    html: `
      <div style="max-width:480px;margin:0 auto;padding:32px 24px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f8fafc;">
        <div style="text-align:center;margin-bottom:24px;">
          <div style="display:inline-block;background:#6366f1;padding:12px;border-radius:16px;color:#fff;font-size:24px;font-weight:800;">
            MoodFood.AI
          </div>
        </div>
        <div style="background:#fff;border-radius:20px;padding:32px;box-shadow:0 2px 12px rgba(0,0,0,0.06);">
          <h2 style="margin:0 0 8px;color:#1e293b;font-size:20px;">邮箱验证码</h2>
          <p style="color:#64748b;font-size:14px;margin:0 0 24px;">
            您正在注册 MoodFood.AI 情绪饮食健康助手，请使用以下验证码完成注册：
          </p>
          <div style="text-align:center;margin:0 0 24px;">
            <span style="display:inline-block;font-size:36px;font-weight:800;letter-spacing:8px;color:#6366f1;background:#eef2ff;padding:16px 32px;border-radius:16px;">
              ${code}
            </span>
          </div>
          <p style="color:#94a3b8;font-size:12px;margin:0;text-align:center;">
            验证码 10 分钟内有效 · 如非本人操作请忽略
          </p>
        </div>
        <p style="text-align:center;color:#cbd5e1;font-size:11px;margin-top:16px;">
          &copy; ${new Date().getFullYear()} MoodFood.AI
        </p>
      </div>
    `,
  });
}
