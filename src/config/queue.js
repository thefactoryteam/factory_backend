import Queue from "bull"
import logger from "./logger.js"


// Configuration for Redis connection
const redisConfig = {
    redis: process.env.REDIS_URL || "redis://localhost:6379",

    // Configure Redis client options - timeouts, retries, etc
    defaultJobOptions: {
        removeOnComplete: true, // Remove jobs from queue once completed
        removeOnFail: false, // Keep failed jobs for inspection
        attempts: 5, // Default attempts for jobs
        backoff: {
            type: 'exponential',
            delay: 60000, // Start with 1 minute delay, then exponential
        }
    },

    // Configure prefixes for different environments
    prefix: `${process.env.NODE_ENV || 'development'}:queue`
}


// Create queue instances
export const emailQueue = new Queue("newsletter-email", redisConfig)

/**
 * Initialize all queues and their event handlers
 */

export function InitializeQueues() {
    // Set up global event handlers for all queues
    const queues = [emailQueue]

    queues.forEach(queue => {
        // Handle errors at the queue level
        queue.on('error', error => {
            logger.error({ queue: queue.name, err: error }, 'Queue error')
        })
        
        // Log when Redis connection is lost
        queue.on('redis:error', error => {
            logger.error({ queue: queue.name, err: error }, 'Queue Redis error')
        })


        // Log when Redis connection is lost
        queue.on('redis:ready', () => {
            logger.info({ queue: queue.name }, 'Queue Redis connection is ready')
        })
    })

    return {
        shutdown: async () => {
            logger.info('Shutting down queue connections');

            // Close all queue connections when shutting down the app
            return Promise.all(queues.map(queue => queue.close()))
        }
    }
}