import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

let transporter;

if (process.env.SMTP_HOST) {
    transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        secure: false, // true for 465, false for other ports
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
        }
    });
} else {
    // Development configuration
    console.log('No SMTP config found, emails will be logged to console.');
    transporter = {
        sendMail: async (mailOptions) => {
            console.log('-----------------------------------');
            console.log('MOCK EMAIL SEND:');
            console.log(`To: ${mailOptions.to}`);
            console.log(`Subject: ${mailOptions.subject}`);
            console.log(`Text: ${mailOptions.text}`);
            console.log('-----------------------------------');
            return { messageId: 'mock-id' };
        }
    }
}

export default transporter;
