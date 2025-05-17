import Newsletter from "../models/newsletter.model.js";
import { sendWelcomeEmail } from "./email/templates/email.service.simple.js";
import AppError from "../middlewares/errorHandler.js";

export const simpleNewsletterService = async ({ name, email }) => {
  // Check if the email is already subscribed
  const existingSubscriber = await Newsletter.findOne({ email });
  if (existingSubscriber) {
    throw new AppError("This email is already subscribed to the newsletter.", 400);
  }

  // Save the subscription to the database
  const newSubscriber = await Newsletter.create({ name, email });

  // Send welcome email
  try {
    await sendWelcomeEmail({ name, email });
  } catch (error) {
    // Rollback the subscription if email fails
    await Newsletter.findByIdAndDelete(newSubscriber._id);
    throw new AppError("Failed to send confirmation email. Please try again later.", 500);
  }

  return newSubscriber;
};