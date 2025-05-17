
import nodemailer from "nodemailer";
import dotenv from "dotenv";
import WelcomeEmailTemplate from "./welcome.template.js";
dotenv.config();

export const emailTransporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: 465,
    secure: true,
    auth: {
        user: process.env.HOSTINGER_EMAIL,
        pass: process.env.HOSTINGER_EMAIL_PASSWORD,
    },
});

export const sendWelcomeEmail = async ({ name, email }) => {
    const emailContent = WelcomeEmailTemplate.generate({
        name,
        unsubscribeUrl: `${process.env.FRONTEND_URL}/unsubscribe?email=${encodeURIComponent(email)}`,
    });

    const mailOptions = {
        from: `"TechFactory" <info@techfactory.xyz>`,
        to: email,
        subject: emailContent.subject,
        text: emailContent.text,
        html: emailContent.html,
    };

    try {
        await emailTransporter.sendMail(mailOptions);
        console.log(`Welcome email sent to ${email}`);
    } catch (error) {
        console.error(`Failed to send welcome email to ${email}:`, error);
        throw new Error("Failed to send email");
    }
};