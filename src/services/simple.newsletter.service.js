import Newsletter from "../models/newsletter.model.js";
import { emailQueue } from "../config/queue.js"; // Ensure emailQueue is imported
import AppError from "../middlewares/errorHandler.js";

export const simpleNewsletterService = async ({ name, email }) => {
  // Check if the email is already subscribed
  const existingSubscriber = await Newsletter.findOne({ email });
  if (existingSubscriber) {
    throw new AppError("This email is already subscribed to the newsletter.", 400);
  }

  // Save the subscription to the database
  let newSubscriber;
  try {
    newSubscriber = await Newsletter.create({ name, email });
  } catch (error) {
    throw new AppError("Failed to save subscription to the database.", 500);
  }

  // Add email to the queue for asynchronous processing
  try {
    await emailQueue.add(
      {
        name,
        email,
        subscriberId: newSubscriber._id, // Pass the subscriber ID for tracking
      },
      {
        attempts: 3, // Retry up to 3 times
        backoff: {
          type: "exponential",
          delay: 5000, // Start with a 5-second delay
        },
      }
    );
  } catch (error) {
    // Update emailStatus to "failed" if adding to the queue fails
    await Newsletter.findByIdAndUpdate(newSubscriber._id, {
      $set: { emailStatus: "failed" },
    });
    throw new AppError("Failed to process email. Please try again later.", 500);
  }

  return newSubscriber;
};