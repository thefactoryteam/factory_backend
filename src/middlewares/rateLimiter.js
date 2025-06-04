import { rateLimit } from 'express-rate-limit'
import logger from "../config/logger.js";

// Create a rate limiter factory function for specific routes
export const createRateLimiter = (options = {}) => {

    return rateLimit({
        windowMs: options.windowMs || 15 * 60 * 1000,
        limit: options.limit || 100,
        standardHeaders: true,
        legacyHeaders: false,
        message: options.message || 'Too many requests',
        skip: options.skip || (() => false),
        handler: (req, res) => {
            const msg = options.message || 'Too many requests';
            logger.warn(`[RateLimiter] Blocked IP: ${req.ip} on route ${req.originalUrl}`);
            res.status(429).json({ message: msg });
        }
        
    });
}


// Specific rate limiters
export const loginLimiter = createRateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    limit: 5,
    message: 'Too many login attempts, please try again after 15 minutes'
})

export const createAccountLimiter = createRateLimiter({
    windowMs: 60 * 60 * 1000, // 1 hour
    limit: 5, // limit to 5 account creations per hour
    message: 'Too many accounts created from this IP, please try again after an hour'
})

export const newsletterLimiter = createRateLimiter({
    windowMs: 15 * 60 * 1000,
    limit: 5,
    message: 'Too many subscription attempts, please try again later'
})

export const contactFormLimiter = createRateLimiter({
    windowMs: 15 * 60 * 1000,
    limit: 5,
    message: 'Too many requests, please try again later.'
})

// Rate limiting for booking submissions
const bookingLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 3, // Limit each IP to 3 requests per windowMs
    message: {
      success: false,
      message: 'Too many booking requests. Please try again in 15 minutes.',
      retryAfter: 15 * 60
    },
    standardHeaders: true,
    legacyHeaders: false,
    // Skip rate limiting for admin users (implement your own logic)
    skip: (req) => {
      return req.user && req.user.role === 'admin';
    }
  });

