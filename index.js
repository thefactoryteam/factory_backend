import app from './src/app.js'
import * as dotenv from 'dotenv'
import logger from './src/config/logger.js'
import { initializeQueues } from './src/config/queue.js';
import { setupEmailProcessor } from './src/workers/email.worker.js';
// import { InitializeQueues } from './src/config/queue.js'

dotenv.config()

// // Initialize queues
// let queueShutdown; // Declare a variable to store the queue shutdown function
// try {
//   const { shutdown } = InitializeQueues();
//   queueShutdown = shutdown; // Assign the shutdown function for later use
//   logger.info('Queues initialized successfully');
// } catch (error) {
//   logger.fatal({ err: error }, 'Failed to initialize queues');
//   process.exit(1); // Exit if queues fail to initialize
// }

// Initialize queues and workers
const queueManager = initializeQueues();
setupEmailProcessor();

// unhandled promise rejections and exceptions
process.on('unhandledRejection', (err) => {
    logger.error({ err }, 'Unhandled rejection')

    // In production, you might want to gracefully shutdown
  // process.exit(1);
})

process.on('uncaughtException', (err) => {
    logger.fatal({ err }, 'Uncaught exception')
    // Always exit on uncaught exceptions
    process.exit(1)
})

const PORT = process.env.PORT || 3000

const server = app.listen(PORT, () => {
    logger.info(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
})

// Graceful shutdown
const shutdown = () => {
    logger.info('Received shutdown signal. Closing server ...');
    server.close(() => {
        logger.info('Server closed')
        process.exit(0)
    });

    // Force close after timeout
    setTimeout(() => {
        logger.error('Could not close connections in time, forcefully shutting down');
        process.exit(1);
    }, 10000) //10 seconds
}

process.on('SIGTERM', shutdown),
process.on('SIGINT', shutdown)