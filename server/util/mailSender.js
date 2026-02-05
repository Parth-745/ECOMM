const nodemailer = require('nodemailer');
require('dotenv').config();
const emailTemplate = require('../emailTemplate');

const mailsender = async (email, title, otp) => {
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

        let info = await transporter.sendMail({
            from: process.env.MAIL_USER,
            to: email,
            subject: title,
            html: emailTemplate(otp, title),
        });

        return { success: true, info };
    } catch (e) {
        console.log("In Utils - Email Error:", e.message);
        return { success: false, error: e.message };
    }
}

module.exports = mailsender;
