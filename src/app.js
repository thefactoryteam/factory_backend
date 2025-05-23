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

// Enable trust proxy for reverse proxies like Render
app.set("trust proxy", 1); // 1 means trust the first proxy

// connect to database
connectDB()

// Request logging
app.use(
  pinoHttp({
    logger,
    customLogLevel: (res, err) => {
      if (err || res.statusCode >= 500) return "error"; // Log as error for server errors
      if (res.statusCode >= 400) return "warn"; // Log as warn for client errors
      return "info"; // Log as info for successful requests
    },
    serializers: {
      req: (req) => ({
        method: req.method,
        url: req.url,
        ip: req.ip,
      }),
      res: (res) => ({
        statusCode: res.statusCode,
      }),
    },
    autoLogging: {
      ignorePaths: ["/health"], // Ignore health check logs if not needed
    },
  })
);

// Security middleware
app.use(helmet())
const allowedOrigins = process.env.CORS_ORIGIN?.split(',') || [];

  app.use(cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);
  
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
  }));
  
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
