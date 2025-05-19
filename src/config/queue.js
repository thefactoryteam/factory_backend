// import Queue from "bull"
// import logger from "./logger.js"


// // Configuration for Redis connection
// const redisConfig = {
//     redis: process.env.REDIS_URL || "redis://localhost:6379",

//     // Configure Redis client options - timeouts, retries, etc
//     defaultJobOptions: {
//         removeOnComplete: true, // Remove jobs from queue once completed
//         removeOnFail: false, // Keep failed jobs for inspection
//         attempts: 5, // Default attempts for jobs
//         backoff: {
//             type: 'exponential',
//             delay: 60000, // Start with 1 minute delay, then exponential
//         }
//     },

//     // Configure prefixes for different environments
//     prefix: `${process.env.NODE_ENV || 'development'}:queue`
// }


// // Create queue instances
// export const emailQueue = new Queue("newsletter-email", redisConfig)

// /**
//  * Initialize all queues and their event handlers
//  */

// export function InitializeQueues() {
//     // Set up global event handlers for all queues
//     const queues = [emailQueue]

//     queues.forEach(queue => {
//         // Handle errors at the queue level
//         queue.on('error', error => {
//             logger.error({ queue: queue.name, err: error }, 'Queue error')
//         })

//         // Log when Redis connection is lost
//         queue.on('redis:error', error => {
//             logger.error({ queue: queue.name, err: error }, 'Queue Redis error')
//         })


//         // Log when Redis connection is lost
//         queue.on('redis:ready', () => {
//             logger.info({ queue: queue.name }, 'Queue Redis connection is ready')
//         })
//     })

//     return {
//         shutdown: async () => {
//             logger.info('Shutting down queue connections');

//             // Close all queue connections when shutting down the app
//             return Promise.all(queues.map(queue => queue.close()))
//         }
//     }
// }




import Queue from "bull";
import logger from "./logger.js";
import dotenv from "dotenv";
dotenv.config();

console.log("REDIS_URL>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>:", process.env.REDIS_URL);

const redisConfig = {
  redis: {
    url: process.env.REDIS_URL, // Use the secure Redis URL from Upstash
    tls: {
      rejectUnauthorized: false, // Allow self-signed certificates (Upstash uses secure connections)
    },
  },
  defaultJobOptions: {
    removeOnComplete: true, // Automatically remove completed jobs
    removeOnFail: false, // Keep failed jobs for debugging
    attempts: 5, // Retry failed jobs up to 5 times
    backoff: {
      type: "exponential", // Exponential backoff for retries
      delay: 6000, // Start with a 6-second delay
    },
  },
  prefix: `${process.env.NODE_ENV || "development"}:queue`, // Prefix for queue names
};

// Create the email queue
export const emailQueue = new Queue("newsletter-email", redisConfig);

console.log("Redis Config<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<:", redisConfig);

/**
 * Initialize all queues and their event handlers
 */
export function InitializeQueues() {
  const queues = [emailQueue];

  queues.forEach((queue) => {
    // Handle errors at the queue level
    queue.on("error", (error) => {
      logger.error({ queue: queue.name, err: error }, "Queue error");
    });

    // Log when Redis connection is ready
    queue.on("ready", () => {
      logger.info({ queue: queue.name }, "Queue Redis connection is ready");
    });

    // Log when Redis connection is lost
    queue.on("stalled", (job) => {
      logger.warn({ queue: queue.name, jobId: job.id }, "Job stalled");
    });
  });

  return {
    shutdown: async () => {
      logger.info("Shutting down queue connections...");
      await Promise.all(queues.map((queue) => queue.close()));
      logger.info("All queues shut down successfully.");
    },
  };
}