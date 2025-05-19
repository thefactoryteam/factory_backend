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
















// import Queue from "bull";
// import logger from "./logger.js";
// import dotenv from "dotenv";
// dotenv.config();

// console.log("REDIS_URL>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>:", process.env.REDIS_URL);

// const redisConfig = {
//   redis: {
//     url: process.env.REDIS_URL, // Use the secure Redis URL from Upstash
//     tls: {
//       rejectUnauthorized: false, // Allow self-signed certificates (Upstash uses secure connections)
//     },
//   },
//   defaultJobOptions: {
//     removeOnComplete: true, // Automatically remove completed jobs
//     removeOnFail: false, // Keep failed jobs for debugging
//     attempts: 5, // Retry failed jobs up to 5 times
//     backoff: {
//       type: "exponential", // Exponential backoff for retries
//       delay: 6000, // Start with a 6-second delay
//     },
//   },
//   prefix: `${process.env.NODE_ENV || "development"}:queue`, // Prefix for queue names
// };

// // Create the email queue
// export const emailQueue = new Queue("newsletter-email", redisConfig);

// console.log("Redis Config<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<:", redisConfig);

// /**
//  * Initialize all queues and their event handlers
//  */
// export function InitializeQueues() {
//   const queues = [emailQueue];

//   queues.forEach((queue) => {
//     // Handle errors at the queue level
//     queue.on("error", (error) => {
//       logger.error({ queue: queue.name, err: error }, "Queue error");
//     });

//     // Log when Redis connection is ready
//     queue.on("ready", () => {
//       logger.info({ queue: queue.name }, "Queue Redis connection is ready");
//     });

//     // Log when Redis connection is lost
//     queue.on("stalled", (job) => {
//       logger.warn({ queue: queue.name, jobId: job.id }, "Job stalled");
//     });
//   });

//   return {
//     shutdown: async () => {
//       logger.info("Shutting down queue connections...");
//       await Promise.all(queues.map((queue) => queue.close()));
//       logger.info("All queues shut down successfully.");
//     },
//   };
// }




















// config/queue.js
import Queue from "bull";
import logger from "./logger.js";
import dotenv from "dotenv";
dotenv.config();

// Validate Redis URL before attempting to use it
if (!process.env.REDIS_URL) {
  logger.error('REDIS_URL environment variable is missing');
  throw new Error('REDIS_URL environment variable is missing');
}

// Parse the Redis URL to extract host, port, password, etc.
const parseRedisUrl = (url) => {
  try {
    const parsedUrl = new URL(url);
    return {
      host: parsedUrl.hostname,
      port: parseInt(parsedUrl.port, 10) || 6379,
      username: parsedUrl.username || undefined,
      password: parsedUrl.password || undefined,
      tls: parsedUrl.protocol === 'rediss:' ? { rejectUnauthorized: false } : undefined
    };
  } catch (error) {
    logger.error({ err: error }, 'Failed to parse Redis URL');
    throw new Error('Invalid REDIS_URL format');
  }
};

// Create Redis configuration based on the parsed URL
const redisConfig = (() => {
  try {
    const redisUrl = process.env.REDIS_URL;
    
    // Log sanitized URL for debugging (remove password)
    const sanitizedUrl = redisUrl.replace(/\/\/([^:]+):([^@]+)@/, '//[USER]:[PASSWORD]@');
    logger.info(`Connecting to Redis: ${sanitizedUrl}`);
    
    if (redisUrl.includes('upstash') || redisUrl.includes('rediss://')) {
      const parsedUrl = new URL(redisUrl);
    
      return {
        redis: {
          host: parsedUrl.hostname,
          port: parseInt(parsedUrl.port, 10) || 6379,
          password: parsedUrl.password,
          username: parsedUrl.username || undefined,
          tls: { rejectUnauthorized: false },
        },
      };
    }
     else {
      // For standard Redis connection
      const parsedConfig = parseRedisUrl(redisUrl);
      return { redis: parsedConfig };
    }
  } catch (error) {
    logger.error({ err: error }, 'Failed to configure Redis');
    throw error;
  }
})();

// Complete Bull queue configuration with sane defaults
const queueConfig = {
  ...redisConfig,
  defaultJobOptions: {
    removeOnComplete: 100, // Keep the latest 100 completed jobs
    removeOnFail: 100,     // Keep the latest 100 failed jobs
    attempts: 5,           // Retry failed jobs up to 5 times
    backoff: {
      type: "exponential", 
      delay: 6000,         // Start with a 6-second delay
    },
  },
  prefix: `${process.env.NODE_ENV || "development"}:queue`,  // Namespace queues by environment
  settings: {
    stalledInterval: 30000,  // Check for stalled jobs every 30 seconds
    maxStalledCount: 2,      // Mark as failed after 2 stalled checks
    drainDelay: 5            // Wait 5ms between processing jobs
  }
};

// Create queues with more robust configuration
export const emailQueue = new Queue("newsletter-email", queueConfig);

// Health check method
export const checkQueueHealth = async () => {
  try {
    // Ping Redis to check connectivity
    const client = emailQueue.client;
    await client.ping();
    return true;
  } catch (error) {
    logger.error({ err: error }, "Queue health check failed");
    return false;
  }
};

/**
 * Initialize all queues and their event handlers
 */
export function initializeQueues() {
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
    
    // Handle completed jobs
    queue.on("completed", (job) => {
      logger.info({ queue: queue.name, jobId: job.id }, "Job completed successfully");
    });
    
    // Handle failed jobs
    queue.on("failed", (job, err) => {
      logger.error(
        { queue: queue.name, jobId: job.id, err: err },
        "Job failed"
      );
    });
  });

  return {
    queues,
    shutdown: async () => {
      logger.info("Shutting down queue connections...");
      await Promise.all(queues.map((queue) => queue.close()));
      logger.info("All queues shut down successfully.");
    },
  };
}
