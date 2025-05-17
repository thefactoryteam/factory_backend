import { rateLimit } from 'express-rate-limit'
import morgan from "morgan"
import logger from "./logger.js"
import dotenv from 'dotenv';
dotenv.config();

// Global middleware
export const setGlobalMiddleware = (app) => {
    const windowMs = parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000;  // Convert to number
    const maxRequests = parseInt(process.env.RATE_LIMIT_MAX) || 100;  // Convert to number
    // Rate limiting
    const limiter = rateLimit({
        windowMs: windowMs,
        limit: maxRequests,
        standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
        legacyHeaders: false, // Disable the `X-RateLimit-*` headers
        message: 'Too many requests from this IP, please try again later',
        skip: (req) => {
            // skip rate limiting for internal health checks, if needed
            return req.path === '/health'
        }
    })

    // Apply rate limiting to all API routes
    app.use('/api', limiter)

    // HTTP request logging in development
    if(process.env.NODE_ENV === 'development') {
        app.use(
            morgan('dev', {
                stream: {
                    write: (message) => logger.info(message.trim())
                }
            })
        )
    }
}