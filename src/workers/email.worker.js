// import logger from "../config/logger";
// import { emailQueue } from "../config/queue";
// import Newsletter from "../models/newsletter.model";
// import emailService from "../services/email/email.service";



// /**
//  * Initialize email queue worker
//  * Processes email sending jobs from the queue
//  */

// export function initializeEmailWorker() {
//     // Process jobs from the queue
//     emailQueue.process(async (job) => {
//         const { type, recipient } = job.data;

//         logger.debug(`Processing email job ${job.id} of type ${type} for ${recipient.email}`)

//         try {
//             switch (type) {
//                 case 'welcome':
//                     await processWelcomeEmail(recipient)
//                     break;

//                 // Handle other email types
//                 // case 'newsletter':
//                 //   await processNewsletterEmail(recipient, job.data.content);
//                 //   break;

//                 default:
//                     throw new Error(`Unknown email type: ${type}`);
//             }

//             logger.info(`Email job ${job.id} completed successfully`);
//         } catch (error) {
//             logger.error({ err: error, jobId: job.id }, `Failed to process email job`);
//             throw error; // Re-throw to trigger Bull's retry mechanism
//         }
//     })

//     // Setup queue event handlers
//     setupQueueEventHandlers()
// }

// /**
//  * Process welcome email job
//  * @param {object} recipient - Email recipient
//  */

// async function processWelcomeEmail(recipient) {
//     try {
//         // Send welcome email
//         await emailService.sendWelcomeEmail(recipient)

//         // Update database with email sent status
//         await Newsletter.findByIdAndUpdate(
//             recipient.id,
//             {
//                 emailSent: true,
//                 emailSentAt: new Date()
//             }
//         )

//         logger.info(`Welcome email sent successfully to ${recipient.email}`)
//     } catch (error) {
//         logger.error({ err: error }, `Failed to send welcome email to ${recipient.email}`);
//     throw error;
//     }
// }


// /**
//  * Setup queue event handlers for monitoring and alerting
//  */
// function setupQueueEventHandlers() {
//     // Handle failed jobs
//     emailQueue.on('failed', (job, error) => {
//       logger.error(
//         { jobId: job.id, err: error }, 
//         `Email job failed after ${job.attemptsMade} attempts`
//       );
      
//       // If all retries are exhausted, trigger alerts
//       if (job.attemptsMade >= job.opts.attempts) {
//         handlePermanentFailure(job, error);
//       }
//     });
    
//     // Monitor queue health
//     emailQueue.on('stalled', (job) => {
//       logger.warn({ jobId: job.id }, 'Email job stalled');
//     });
    
//     emailQueue.on('error', (error) => {
//       logger.error({ err: error }, 'Email queue error');
//     });
//   }
  
//   /**
//    * Handle permanent failure of email job
//    * @param {object} job - Failed job
//    * @param {Error} error - Error that caused the failure
//    */
//   async function handlePermanentFailure(job, error) {
//     const { recipient } = job.data;
    
//     logger.alert(
//       { email: recipient.email, jobId: job.id, err: error },
//       `Email delivery permanently failed`
//     );
    
//     try {
//       // Update database with failure status
//       await Newsletter.findByIdAndUpdate(
//         recipient.id,
//         { 
//           emailSent: false, 
//           emailError: error.message,
//           emailErrorAt: new Date()
//         }
//       );
      
//       // Send alert to operations team
//       // This could be a webhook, external monitoring service, etc.
//       if (process.env.ALERT_WEBHOOK) {
//         await fetch(process.env.ALERT_WEBHOOK, {
//           method: 'POST',
//           headers: { 'Content-Type': 'application/json' },
//           body: JSON.stringify({
//             type: 'email_failure',
//             jobId: job.id,
//             recipient: recipient.email,
//             error: error.message,
//             timestamp: new Date()
//           })
//         });
//       }
//     } catch (alertError) {
//       logger.error(
//         { err: alertError }, 
//         'Failed to process alert for permanent email failure'
//       );
//     }
//   }



// import { emailQueue } from "../config/queue.js";
// import Newsletter from "../models/newsletter.model.js";
// import { sendWelcomeEmail } from "../services/email/templates/email.service.simple.js";

// emailQueue.process(async (job) => {
//   const { name, email, subscriberId } = job.data;

//   try {
//     // Send the welcome email
//     await sendWelcomeEmail({ name, email });

//     // Update emailStatus to "sent" in the database
//     await Newsletter.findByIdAndUpdate(subscriberId, {
//       $set: { emailStatus: "sent" },
//     });
//     console.log(`Welcome email sent to ${email}`);
//   } catch (error) {
//     // Update emailStatus to "failed" in the database
//     await Newsletter.findByIdAndUpdate(subscriberId, {
//       $set: { emailStatus: "failed" },
//     });
//     console.error(`Failed to send welcome email to ${email}:`, error);
//     throw error; // Let Bull handle retries
//   }
// });

























// workers/emailProcessor.js
import { emailQueue } from "../config/queue.js";
import Newsletter from "../models/newsletter.model.js";
import { sendWelcomeEmail } from "../services/email/templates/email.service.simple.js";
import logger from "../config/logger.js";

// Dedicated email processor with improved error handling and retry mechanism
export function setupEmailProcessor() {
  emailQueue.process(async (job) => {
    const { name, email, subscriberId } = job.data;
    const jobId = job.id;
    
    logger.info(
      { jobId, subscriberId, email },
      "Processing welcome email job"
    );

    try {
      // Send the welcome email
      await sendWelcomeEmail({ name, email });

      // Update emailStatus to "sent" in the database
      await Newsletter.findByIdAndUpdate(subscriberId, {
        $set: { 
          emailStatus: "sent",
          emailSentAt: new Date()
        }
      });
      
      logger.info(
        { jobId, subscriberId, email },
        "Welcome email sent successfully"
      );
      
      return { success: true, timestamp: new Date().toISOString() };
    } catch (error) {
      // Log detailed error information
      logger.error(
        { 
          jobId, 
          subscriberId, 
          email, 
          attempts: job.attemptsMade + 1,
          err: error 
        },
        "Failed to send welcome email"
      );

      // On final attempt failure, update the database
      if (job.attemptsMade + 1 >= job.opts.attempts) {
        await Newsletter.findByIdAndUpdate(subscriberId, {
          $set: { 
            emailStatus: "failed",
            lastErrorMessage: error.message || "Unknown error",
            lastAttemptAt: new Date()
          }
        });
        
        logger.error(
          { jobId, subscriberId, email },
          "Maximum retry attempts reached for welcome email"
        );
      }
      
      // Throw the error to let Bull know the job failed
      throw error;
    }
  });

  // Additional event handlers for monitoring
  emailQueue.on('active', (job) => {
    logger.debug({ jobId: job.id }, 'Email job started processing');
  });

  emailQueue.on('progress', (job, progress) => {
    logger.debug({ jobId: job.id, progress }, 'Email job progress update');
  });

  logger.info('Email processor has been set up successfully');
}

// Helper function to get job status information - useful for admin endpoints
export async function getEmailQueueStats() {
  try {
    const [
      waiting, 
      active, 
      completed, 
      failed
    ] = await Promise.all([
      emailQueue.getWaitingCount(),
      emailQueue.getActiveCount(),
      emailQueue.getCompletedCount(),
      emailQueue.getFailedCount()
    ]);
    
    return {
      waiting,
      active,
      completed,
      failed,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    logger.error({ err: error }, 'Failed to get email queue stats');
    throw error;
  }
}

// Function to clean up old jobs (can be called periodically)
export async function cleanupOldJobs() {
  try {
    // Clean completed jobs older than 1 day
    await emailQueue.clean(86400000, 'completed');
    
    // Clean failed jobs older than 7 days
    await emailQueue.clean(7 * 86400000, 'failed');
    
    logger.info('Cleaned up old email queue jobs');
  } catch (error) {
    logger.error({ err: error }, 'Failed to clean up old jobs');
    throw error;
  }
}













