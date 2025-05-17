import mongoose from "mongoose"
import Newsletter from "../models/newsletter.model.js";
import { emailQueue } from "../config/queue.js";
import logger from "../config/logger.js";

/**
 * Newsletter Service - Business logic for newsletter functionality
 */

class NewsletterService{
    /**
     * Create a new newsletter subscription
     * @param {string} name - Subscriber's name
     * @param {string} email - Subscribers's email
     * @param {object} metadata - Addtional metadata (IP, user agent)
     * @returns {Promise<object>} - Created subscription
     * @throws {Error} - With code DUPLICATE_SUBSCRIPTION if email already exists
     */

    async createSubscription(name, email, metadata) {
        const normalizedEmail = email.toLowerCase().trim()

        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            // check for existing subscription with case-insensitive match
            const alreadySubscribed = await Newsletter.findOne({ 
                email: { $regex: new RegExp(`^${normalizedEmail.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') } 
              }).lean();

              if (alreadySubscribed){
                const error = new Error("This email is already subscribed")
                error.code = 'DUPLICATE_SUBSCRIPTION';
                throw error;
              }

              // Create new subscription
              const subscription = new Newsletter({
                name,
                email: normalizedEmail,
                subscribedAt: new Date(),
                ipAddress: metadata.ipAddress,
                userAgent: metadata.userAgent,
                emailSent: false
              })

              // Save to database
              await subscription.save({ session })

              // Add email to queue with retry options
              await this._queueWelcomeEmail(subscription)

              // Commit the transaction
              await session.commitTransaction();
              session.endSession()

              return subscription;
        } catch (error) {
            // Roll back transaction on error
            await session.abortTransaction();
            session.endSession()

            // Rethrow the error to be handled by the controller
            throw error;
        }
    }

    /**
     * Queue welcome email for new subscriber
     * @private
     * @param {object} subscription - subscription document
     */

    async _queueWelcomeEmail(subscription){
        try {
            await emailQueue.add(
                {
                    type: 'Welcome',
                    recipient: {
                        id: subscription._id,
                        name: subscription.name,
                        email: subscription.email
                    }
                },
                {
                    attempts: 5,
                    backoff: {
                        type: 'exponential',
                        delay: 60000 // Start with 1 minute delay between retries
                    },
                    removeOnComplete: true,
                    removeOnFail: false // Keep failed jobs for debugging
                }
            )
        } catch (error) {
            logger.error({ err: error }, `Failed to queue welcome email for ${subscription.email}`)
            throw error
        }
    }
}


export default new NewsletterService()