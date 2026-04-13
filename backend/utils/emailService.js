const nodemailer = require('nodemailer');

// ─── Create transporter ───────────────────────────────────────────────────────
const createTransporter = () => {
  return nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE || 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,  // Gmail App Password (not your real password)
    },
  });
};

// ─── Send OTP Email ───────────────────────────────────────────────────────────
exports.sendOTPEmail = async ({ to, name, otp }) => {
  const transporter = createTransporter();

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <style>
        body { margin: 0; padding: 0; background: #f4f6f9; font-family: 'Segoe UI', Arial, sans-serif; }
        .wrapper { max-width: 520px; margin: 40px auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
        .header { background: #080b10; padding: 32px 40px; text-align: center; }
        .brand { color: #00d4ff; font-size: 1.4rem; font-weight: 700; letter-spacing: -0.02em; }
        .brand-dot { display: inline-block; width: 10px; height: 10px; border-radius: 50%; background: #00d4ff; margin-right: 8px; box-shadow: 0 0 12px #00d4ff; }
        .body { padding: 40px; }
        .greeting { font-size: 1.1rem; font-weight: 600; color: #0f172a; margin-bottom: 12px; }
        .text { color: #475569; font-size: 0.95rem; line-height: 1.7; margin-bottom: 28px; }
        .otp-box { background: #f4f6f9; border: 2px dashed #d0d7e2; border-radius: 12px; padding: 28px; text-align: center; margin-bottom: 28px; }
        .otp-label { font-size: 0.78rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: #94a3b8; margin-bottom: 12px; }
        .otp-code { font-size: 3rem; font-weight: 800; letter-spacing: 0.18em; color: #0284c7; font-family: 'Courier New', monospace; line-height: 1; }
        .otp-expire { font-size: 0.8rem; color: #94a3b8; margin-top: 12px; }
        .warning { background: #fef3c7; border-left: 4px solid #d97706; border-radius: 8px; padding: 14px 16px; font-size: 0.85rem; color: #92400e; margin-bottom: 24px; }
        .footer { border-top: 1px solid #e2e8f0; padding: 24px 40px; text-align: center; }
        .footer-text { font-size: 0.78rem; color: #94a3b8; line-height: 1.6; }
      </style>
    </head>
    <body>
      <div class="wrapper">
        <div class="header">
          <div class="brand"><span class="brand-dot"></span>FocusTracker</div>
        </div>
        <div class="body">
          <div class="greeting">Hi ${name} 👋</div>
          <p class="text">
            We received a request to reset the password for your FocusTracker account.
            Use the OTP below to proceed. This code is valid for <strong>10 minutes</strong>.
          </p>
          <div class="otp-box">
            <div class="otp-label">Your Reset Code</div>
            <div class="otp-code">${otp}</div>
            <div class="otp-expire">⏱ Expires in 10 minutes</div>
          </div>
          <div class="warning">
            🔒 If you didn't request this, you can safely ignore this email. Your password won't change.
          </div>
          <p class="text" style="margin-bottom:0;">
            Stay focused,<br/>
            <strong>The FocusTracker Team</strong>
          </p>
        </div>
        <div class="footer">
          <p class="footer-text">
            This email was sent to ${to}<br/>
            © ${new Date().getFullYear()} FocusTracker. All rights reserved.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;

  await transporter.sendMail({
    from: `"FocusTracker" <${process.env.EMAIL_USER}>`,
    to,
    subject: `${otp} is your FocusTracker reset code`,
    html,
  });
};
