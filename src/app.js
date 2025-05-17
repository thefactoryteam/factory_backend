import compression from 'compression';
import express from 'express';
import hpp from 'hpp';
import { pinoHttp } from 'pino-http';
import indexRoute from './api/routes/index.route.js'
import helmet from 'helmet';
import cors from 'cors'
import logger from './config/logger.js';
import { setGlobalMiddleware } from './config/middleware.js';
import { errorHandler } from './middlewares/errorHandler.js';
import { createAccountLimiter, loginLimiter } from './middlewares/rateLimiter.js';
import connectDB from './config/database.js';

// initialize our entire express app
const app = express()

// connect to database
connectDB()

// Request logging
app.use(pinoHttp({ logger }))

// Security middleware
app.use(helmet())
app.use(cors({
    origin: process.env.CORS_ORIGIN || '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization']
}))
app.use(hpp())

// Body parser
app.use(express.json({ limit: '10kb' }))
app.use(express.urlencoded({ extended: true, limit: '10kb' }))

// Compression
app.use(compression())

// Applying rate limiting and other global middleware
setGlobalMiddleware(app)

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok' })
})

// Api routes
app.use('/api/v1', indexRoute)

// 404 handler
app.use(function(req, res) {
    res.status(404).json({
        success: false,
        message: `${req.originalUrl} not found`
    })
})

// Global erorr handler
app.use(errorHandler)

export default app