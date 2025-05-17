import logger from "../config/logger.js"
import AppError from "../middlewares/errorHandler.js"
import Newsletter from "../models/newsletter.model.js"
import nodemailer from "nodemailer"
import dotenv from "dotenv"
dotenv.config()


export const simpleNewsletterService = async ({ name, email }) => {
    const existingSubscriber = await Newsletter.findOne({ email })

    if (existingSubscriber) {
        throw new AppError("This email is already subscribe to the newsletter.", 400)
    }

    const newSubscriber = await Newsletter.create({ name, email });

    const transporter = nodemailer.createTransport({
        host: "smtp.titan.email",
        port: 465,
        secure: true,
        auth: {
            user: process.env.HOSTINGER_EMAIL,
            pass: process.env.HOSTINGER_EMAIL_PASSWORD
        }
    })

    // Email content
    const mailOptions = {
        from: '"TechFactory" <info@techfactory.xyz>', // Sender address
        to: email, // Recipient
        subject: "Welcome to TechFactory Newsletter!",
        text: `Hi ${name},\n\nThank you for subscribing to our newsletter! Stay tuned for updates.\n\nBest regards,\nTechFactory Team`,
        html: `<p>Hi ${name},</p><p>Thank you for subscribing to our newsletter! Stay tuned for updates.</p><p>Best regards,<br>TechFactory Team</p>`,
    };

    try {
        await transporter.sendMail(mailOptions)
    } catch (error) {
        logger.error({ err: error }, "Failed to send confirmatin email. Please try again later")
        throw error
    }

    return newSubscriber
}
