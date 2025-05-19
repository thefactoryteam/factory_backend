// import asyncHandler from 'express-async-handler'
// import { simpleNewsletterService } from '../../services/simple.newsletter.service.js';

// /**
//  * @desc    Subscribe to newsletter
//  * @route   Post /api/v1/simple-newsletter
//  * @access  Public
//  */

// export const createNewsletter = asyncHandler(async (req, res, next) => {
//     const { name, email } = req.body

//     console.log(req.body);
    
    
//     // Call the service layer to handle the subscription
//   const newSubscriber = await simpleNewsletterService({ name, email });

//   return res.status(201).json({
//     success: true,
//     message: "Thank you for subscribing!",
//     data: {
//       id: newSubscriber._id,
//       name: newSubscriber.name,
//       email: newSubscriber.email,
//     },
//   });
// }) 






// controllers/simple.newsletter.controller.js
import asyncHandler from 'express-async-handler';
import { simpleNewsletterService } from '../../services/simple.newsletter.service.js';
// import { getEmailQueueStats } from '../../workers/emailProcessor.js';
import logger from '../../config/logger.js';
import { getEmailQueueStats } from '../../workers/email.worker.js';

/**
 * @desc    Subscribe to newsletter
 * @route   POST /api/v1/simple-newsletter
 * @access  Public
 */
export const createNewsletter = asyncHandler(async (req, res, next) => {
    const startTime = Date.now();getEmailQueueStats
    const { name, email } = req.body;
    
    // Basic validation at controller level
    if (!name || !email) {
        return res.status(400).json({
            success: false,
            message: "Name and email are required"
        });
    }
    
    try {
        // Call the service layer to handle the subscription
        const subscriber = await simpleNewsletterService({ name, email });
        
        // Customize response based on subscriber status
        let message = "Thank you for subscribing!";
        if (subscriber.status === "queued_delayed") {
            message = "Thank you for subscribing! Your welcome email will be sent shortly.";
        } else if (subscriber.status === "existing_retry") {
            message = "You're already subscribed! We're sending you a fresh welcome email.";
        }
        
        // Log successful request timing for performance monitoring
        const responseTime = Date.now() - startTime;
        logger.info({
            subscriberId: subscriber._id,
            email,
            responseTime,
        }, "Newsletter subscription processed successfully");
        
        return res.status(201).json({
            success: true,
            message,
            data: {
                id: subscriber._id,
                name: subscriber.name,
                email: subscriber.email,
            },
        });
    } catch (error) {
        // Log error details with timing for performance monitoring
        const responseTime = Date.now() - startTime;
        logger.error({
            error: error.message,
            email,
            stack: error.stack,
            responseTime,
        }, "Newsletter subscription failed");
        
        // If it's a known error type, use its status code and message
        if (error.statusCode) {
            return res.status(error.statusCode).json({
                success: false,
                message: error.message
            });
        }
        
        // Otherwise, throw to the global error handler
        next(error);
    }
});

/**
 * @desc    Get newsletter queue status (admin only)
 * @route   GET /api/v1/simple-newsletter/queue-status
 * @access  Admin
 */
export const getQueueStatus = asyncHandler(async (req, res) => {
    // Assuming authentication middleware has already verified admin status
    try {
        const stats = await getEmailQueueStats();
        
        return res.status(200).json({
            success: true,
            data: stats
        });
    } catch (error) {
        logger.error({ err: error }, "Failed to get queue status");
        
        return res.status(500).json({
            success: false,
            message: "Failed to retrieve queue status"
        });
    }
});