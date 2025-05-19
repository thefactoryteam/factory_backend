// import Newsletter from "../models/newsletter.model.js";
// import { emailQueue } from "../config/queue.js"; // Ensure emailQueue is imported
// import AppError from "../middlewares/errorHandler.js";

// export const simpleNewsletterService = async ({ name, email }) => {
//   // Check if the email is already subscribed
//   const existingSubscriber = await Newsletter.findOne({ email });
//   if (existingSubscriber) {
//     throw new AppError("This email is already subscribed to the newsletter.", 400);
//   }

//   // Save the subscription to the database
//   let newSubscriber;
//   try {
//     newSubscriber = await Newsletter.create({ name, email });
//   } catch (error) {
//     throw new AppError("Failed to save subscription to the database.", 500);
//   }

//   // Add email to the queue for asynchronous processing
//   try {
//     await emailQueue.add(
//       {
//         name,
//         email,
//         subscriberId: newSubscriber._id, // Pass the subscriber ID for tracking
//       },
//       {
//         attempts: 3, // Retry up to 3 times
//         backoff: {
//           type: "exponential",
//           delay: 5000, // Start with a 5-second delay
//         },
//       }
//     );
//   } catch (error) {
//     // Update emailStatus to "failed" if adding to the queue fails
//     await Newsletter.findByIdAndUpdate(newSubscriber._id, {
//       $set: { emailStatus: "failed" },
//     });
//     throw new AppError("Failed to process email. Please try again later.", 500);
//   }

//   return newSubscriber;
// };

























// services/simple.newsletter.service.js
import Newsletter from "../models/newsletter.model.js";
import { emailQueue, checkQueueHealth } from "../config/queue.js";
import AppError from "../middlewares/errorHandler.js";
import logger from "../config/logger.js";

export const simpleNewsletterService = async ({ name, email }) => {
  // Basic validation
  if (!name || !email) {
    throw new AppError("Name and email are required", 400);
  }
  
  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new AppError("Invalid email format", 400);
  }

  // Check if the email is already subscribed
  const existingSubscriber = await Newsletter.findOne({ email });
  if (existingSubscriber) {
    // If already subscribed but welcome email failed previously, retry sending it
    if (existingSubscriber.emailStatus === "failed") {
      try {
        await queueWelcomeEmail(existingSubscriber.name, existingSubscriber.email, existingSubscriber._id);
        await Newsletter.findByIdAndUpdate(existingSubscriber._id, {
          $set: { emailStatus: "queued", updatedAt: new Date() }
        });
        
        return {
          _id: existingSubscriber._id,
          name: existingSubscriber.name,
          email: existingSubscriber.email,
          status: "existing_retry"
        };
      } catch (error) {
        logger.error({ err: error, email }, "Failed to requeue welcome email for existing subscriber");
        // Continue with the normal flow - inform user they're already subscribed
      }
    }
    
    throw new AppError("This email is already subscribed to the newsletter.", 400);
  }

  // Save the subscription to the database with appropriate initial state
  let newSubscriber;
  try {
    newSubscriber = await Newsletter.create({ 
      name, 
      email, 
      emailStatus: "pending",
      subscriptionDate: new Date()
    });
    
    logger.info({ subscriberId: newSubscriber._id, email }, "New newsletter subscription created");
  } catch (error) {
    logger.error({ err: error, email }, "Failed to save subscription to database");
    throw new AppError("Failed to save subscription to the database.", 500);
  }

  // Check Redis connection health before attempting to add to queue
  const queueHealthy = await checkQueueHealth();
  if (!queueHealthy) {
    // Fallback: Save subscription but mark for later email processing
    await Newsletter.findByIdAndUpdate(newSubscriber._id, {
      $set: { emailStatus: "pending_retry" }
    });
    
    logger.warn({ subscriberId: newSubscriber._id, email }, "Queue unavailable, subscription saved for later processing");
    
    // Return success to user but with a note about email delay
    return {
      _id: newSubscriber._id,
      name: newSubscriber.name,
      email: newSubscriber.email,
      status: "queued_delayed"
    };
  }

  // Queue the welcome email
  try {
    await queueWelcomeEmail(name, email, newSubscriber._id);
    
    // Update status to queued
    await Newsletter.findByIdAndUpdate(newSubscriber._id, {
      $set: { emailStatus: "queued" }
    });
    
    logger.info({ subscriberId: newSubscriber._id, email }, "Welcome email queued successfully");
  } catch (error) {
    logger.error({ err: error, subscriberId: newSubscriber._id, email }, "Failed to queue welcome email");
    
    // Update status to failed but keep the subscription
    await Newsletter.findByIdAndUpdate(newSubscriber._id, {
      $set: { emailStatus: "failed" }
    });
    
    // Don't throw - we want the subscription to succeed even if email queueing fails
    // The retry mechanism will handle this later
  }

  return newSubscriber;
};

// Helper function to queue welcome emails with consistent options
async function queueWelcomeEmail(name, email, subscriberId) {
  return emailQueue.add(
    {
      name,
      email,
      subscriberId,
      timestamp: new Date().toISOString() // Add timestamp for debugging
    },
    {
      attempts: 3,
      backoff: {
        type: "exponential",
        delay: 5000,
      },
      removeOnComplete: true,
      jobId: `welcome_${subscriberId}_${Date.now()}` // Ensure unique job IDs
    }
  );
}

// Utility function to retry failed emails (can be called by a cron job)
export const retryFailedEmails = async () => {
  try {
    // Find subscribers with failed email status
    const failedSubscribers = await Newsletter.find({ emailStatus: "failed" });
    
    let successCount = 0;
    for (const subscriber of failedSubscribers) {
      try {
        await queueWelcomeEmail(subscriber.name, subscriber.email, subscriber._id);
        await Newsletter.findByIdAndUpdate(subscriber._id, {
          $set: { emailStatus: "queued", updatedAt: new Date() }
        });
        successCount++;
      } catch (error) {
        logger.error(
          { err: error, subscriberId: subscriber._id, email: subscriber.email },
          "Failed to retry welcome email"
        );
      }
    }
    
    return { processed: failedSubscribers.length, success: successCount };
  } catch (error) {
    logger.error({ err: error }, "Failed to process retry for failed emails");
    throw error;
  }
};