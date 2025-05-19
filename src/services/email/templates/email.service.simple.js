
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
        // Send welcome email to the subscriber
        await emailTransporter.sendMail(mailOptions);
        console.log(`Welcome email sent to ${email}`);

        // Send notification email to yourself
        const notificationMailOptions = {
            from: `"TechFactory" <info@techfactory.xyz>`,
            to: process.env.ADMIN_EMAIL, // Your email address
            subject: "New Newsletter Subscription",
            text: `A new user has subscribed to the newsletter.\n\nName: ${name}\nEmail: ${email}`,
            html: `
                <p>A new user has subscribed to the newsletter:</p>
                <ul>
                    <li><strong>Name:</strong> ${name}</li>
                    <li><strong>Email:</strong> ${email}</li>
                </ul>
            `,
        };

        await emailTransporter.sendMail(notificationMailOptions);
        console.log(`Notification email sent to admin (${process.env.ADMIN_EMAIL})`);
    } catch (error) {
        console.error(`Failed to send welcome or notification email:`, error);
        throw new Error("Failed to send email");
    }
};