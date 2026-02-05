module.exports = (otp, title = 'Verify Your Account') => {
  const year = new Date().getFullYear();
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>OTP Verification</title>
    <style>
      body { margin: 0; padding: 0; background: #f4f6f8; font-family: Arial, Helvetica, sans-serif; color: #222; }
      .container { max-width: 600px; margin: 24px auto; padding: 0 16px; }
      .card { background: #ffffff; border-radius: 8px; padding: 24px; border: 1px solid #e6e9ee; box-shadow: 0 1px 3px rgba(16,24,40,0.04); }
      .brand { font-size: 20px; font-weight: 700; color: #0d6efd; margin-bottom: 8px; }
      h1 { margin: 0 0 8px 0; font-size: 20px; color: #111; }
      .muted { color: #6c757d; font-size: 14px; line-height: 1.4; }
      .otp { display: inline-block; background: #f0f8ff; color: #0d6efd; font-weight: 700; font-size: 28px; padding: 14px 20px; border-radius: 8px; letter-spacing: 6px; margin: 18px 0; }
      .footer { text-align: center; color: #95a1aa; font-size: 12px; margin-top: 14px; }
      @media (max-width: 420px) { .otp { font-size: 22px; padding: 12px 16px; letter-spacing: 4px; } }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="card">
        <div class="brand">GROOVO</div>
        <h1>${title}</h1>
        <p class="muted">Use the code below to complete your sign-in. This code is valid for <strong>2 minutes</strong>.</p>
        <div class="otp">${otp}</div>
        <p class="muted">Do not share this code with anyone. If you did not request this, please ignore this email.</p>
        <p style="margin:16px 0 0 0;">Thanks,<br/>GROOVO Team</p>
      </div>
      <div class="footer">© ${year} GROOVO. All rights reserved.</div>
    </div>
  </body>
</html>`;
};
