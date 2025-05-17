import logger from "../config/logger";
import { emailQueue } from "../config/queue";
import Newsletter from "../models/newsletter.model";
import emailService from "../services/email/email.service";

/**
 * Initialize email queue worker
 * Processes email sending jobs from the queue
 */

export function initializeEmailWorker() {
    // Process jobs from the queue
    emailQueue.process(async (job) => {
        const { type, recipient } = job.data;

        logger.debug(`Processing email job ${job.id} of type ${type} for ${recipient.email}`)

        try {
            switch (type) {
                case 'welcome':
                    await processWelcomeEmail(recipient)
                    break;

                // Handle other email types
                // case 'newsletter':
                //   await processNewsletterEmail(recipient, job.data.content);
                //   break;

                default:
                    throw new Error(`Unknown email type: ${type}`);
            }

            logger.info(`Email job ${job.id} completed successfully`);
        } catch (error) {
            logger.error({ err: error, jobId: job.id }, `Failed to process email job`);
            throw error; // Re-throw to trigger Bull's retry mechanism
        }
    })

    // Setup queue event handlers
    setupQueueEventHandlers()
}

/**
 * Process welcome email job
 * @param {object} recipient - Email recipient
 */

async function processWelcomeEmail(recipient) {
    try {
        // Send welcome email
        await emailService.sendWelcomeEmail(recipient)

        // Update database with email sent status
        await Newsletter.findByIdAndUpdate(
            recipient.id,
            {
                emailSent: true,
                emailSentAt: new Date()
            }
        )

        logger.info(`Welcome email sent successfully to ${recipient.email}`)
    } catch (error) {
        logger.error({ err: error }, `Failed to send welcome email to ${recipient.email}`);
    throw error;
    }
}


/**
 * Setup queue event handlers for monitoring and alerting
 */
function setupQueueEventHandlers() {
    // Handle failed jobs
    emailQueue.on('failed', (job, error) => {
      logger.error(
        { jobId: job.id, err: error }, 
        `Email job failed after ${job.attemptsMade} attempts`
      );
      
      // If all retries are exhausted, trigger alerts
      if (job.attemptsMade >= job.opts.attempts) {
        handlePermanentFailure(job, error);
      }
    });
    
    // Monitor queue health
    emailQueue.on('stalled', (job) => {
      logger.warn({ jobId: job.id }, 'Email job stalled');
    });
    
    emailQueue.on('error', (error) => {
      logger.error({ err: error }, 'Email queue error');
    });
  }
  
  /**
   * Handle permanent failure of email job
   * @param {object} job - Failed job
   * @param {Error} error - Error that caused the failure
   */
  async function handlePermanentFailure(job, error) {
    const { recipient } = job.data;
    
    logger.alert(
      { email: recipient.email, jobId: job.id, err: error },
      `Email delivery permanently failed`
    );
    
    try {
      // Update database with failure status
      await Newsletter.findByIdAndUpdate(
        recipient.id,
        { 
          emailSent: false, 
          emailError: error.message,
          emailErrorAt: new Date()
        }
      );
      
      // Send alert to operations team
      // This could be a webhook, external monitoring service, etc.
      if (process.env.ALERT_WEBHOOK) {
        await fetch(process.env.ALERT_WEBHOOK, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'email_failure',
            jobId: job.id,
            recipient: recipient.email,
            error: error.message,
            timestamp: new Date()
          })
        });
      }
    } catch (alertError) {
      logger.error(
        { err: alertError }, 
        'Failed to process alert for permanent email failure'
      );
    }
  }