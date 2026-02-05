const nodemailer = require('nodemailer');
require('dotenv').config();

const weeklyDeliveryTemplate = (deliveryDate, deliveryTime, items, confirmUrl, cancelUrl) => {
  const year = new Date().getFullYear();
  const itemsList = items.map(item =>
    `<li style="margin: 8px 0; padding: 8px; background: #f8f9fa; border-radius: 4px;">
      <strong>${item.productId.name}</strong> - Quantity: ${item.quantity} (${item.productId.price * item.quantity}₹)
    </li>`
  ).join('');

  const totalAmount = items.reduce((total, item) => total + (item.productId.price * item.quantity), 0);

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Weekly Delivery Reminder</title>
    <style>
      body { margin: 0; padding: 0; background: #f4f6f8; font-family: Arial, Helvetica, sans-serif; color: #222; }
      .container { max-width: 600px; margin: 24px auto; padding: 0 16px; }
      .card { background: #ffffff; border-radius: 8px; padding: 24px; border: 1px solid #e6e9ee; box-shadow: 0 1px 3px rgba(16,24,40,0.04); }
      .brand { font-size: 20px; font-weight: 700; color: #0d6efd; margin-bottom: 8px; }
      h1 { margin: 0 0 8px 0; font-size: 20px; color: #111; }
      .muted { color: #6c757d; font-size: 14px; line-height: 1.4; }
      .delivery-info { background: #e3f2fd; padding: 16px; border-radius: 8px; margin: 16px 0; border-left: 4px solid #2196f3; }
      .items-list { background: #f8f9fa; padding: 16px; border-radius: 8px; margin: 16px 0; }
      .total { font-size: 18px; font-weight: bold; color: #2e7d32; text-align: center; margin: 16px 0; }
      .buttons { text-align: center; margin: 24px 0; }
      .btn { display: inline-block; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600; margin: 0 8px; }
      .btn-yes { background: #4caf50; color: white; }
      .btn-no { background: #f44336; color: white; }
      .footer { text-align: center; color: #95a1aa; font-size: 12px; margin-top: 14px; }
      @media (max-width: 420px) { .btn { display: block; margin: 8px 0; } }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="card">
        <div class="brand">GROOVO</div>
        <h1>🛒 Your Weekly Delivery is Coming Up!</h1>
        <p class="muted">This is a reminder that your Groovo Plus weekly delivery is scheduled for tomorrow.</p>

        <div class="delivery-info">
          <h3 style="margin: 0 0 8px 0; color: #1976d2;">📅 Delivery Details</h3>
          <p style="margin: 4px 0;"><strong>Date:</strong> ${deliveryDate}</p>
          <p style="margin: 4px 0;"><strong>Time:</strong> ${deliveryTime}</p>
        </div>

        <div class="items-list">
          <h3 style="margin: 0 0 12px 0; color: #333;">📦 Your Weekly Items</h3>
          <ul style="list-style: none; padding: 0; margin: 0;">
            ${itemsList}
          </ul>
          <div class="total">Total: ₹${totalAmount}</div>
        </div>

        <p class="muted" style="text-align: center; margin: 20px 0;">
          Please confirm if you'd like us to proceed with this delivery:
        </p>

        <div class="buttons">
          <a href="${confirmUrl}" class="btn btn-yes">✅ YES, Proceed with Delivery</a>
          <a href="${cancelUrl}" class="btn btn-no">❌ NO, Skip this Week</a>
        </div>

        <p class="muted" style="font-size: 12px; text-align: center; margin-top: 20px;">
          If you don't confirm, we'll automatically proceed with the delivery as scheduled.<br/>
          You can manage your weekly schedule anytime from your account settings.
        </p>

        <p style="margin:16px 0 0 0;">Thanks,<br/>GROOVO Plus Team</p>
      </div>
      <div class="footer">© ${year} GROOVO. All rights reserved.</div>
    </div>
  </body>
</html>`;
};

const sendWeeklyDeliveryReminder = async (email, deliveryDate, deliveryTime, items, confirmUrl, cancelUrl) => {
    try {
        const transporter = nodemailer.createTransport({
            host: "smtp.gmail.com",
            port: 465,
            secure: true,
            auth: {
                user: process.env.MAIL_USER,
                pass: process.env.MAIL_PASS,
            },
        });

        const htmlContent = weeklyDeliveryTemplate(deliveryDate, deliveryTime, items, confirmUrl, cancelUrl);

        let info = await transporter.sendMail({
            from: process.env.MAIL_USER,
            to: email,
            subject: "🛒 Your Groovo Plus Weekly Delivery Reminder",
            html: htmlContent,
        });

        return { success: true, info };
    } catch (e) {
        console.log("Weekly Delivery Email Error:", e.message);
        return { success: false, error: e.message };
    }
};

module.exports = {
    sendWeeklyDeliveryReminder,
    weeklyDeliveryTemplate
};