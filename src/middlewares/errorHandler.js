import logger from "../config/logger.js";

class AppError extends Error {
    constructor(message, statusCode){
        super(message);
        this.statusCode = statusCode;
        this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
        this.isOperational = true;

        Error.captureStackTrace(this, this.constructor)
    }
}

// Global error handler
export const errorHandler = (err, req, res, next) => {
    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';

    // Log error
    if (err.statusCode >= 500){
        logger.error({
            err,
            req: {
                method: req.method,
                url: req.originalUrl,
                ip: req.ip,
            }
        }, 'Server error')
    } else {
        logger.warn({
            err,
            req: {
                method: req.method,
                url: req.originalUrl,
            }
        }, 'Client error')
    }

     // Mongoose duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    err = new AppError(`Duplicate field value: ${field}. Please use another value`, 400);
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map((el) => el.message);
    err = new AppError(errors.join('. '), 400);
  }

  // Mongoose cast error
  if (err.name === 'CastError') {
    err = new AppError(`Invalid ${err.path}: ${err.value}`, 400);
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    err = new AppError('Invalid token. Please log in again', 401);
  }

  if (err.name === 'TokenExpiredError') {
    err = new AppError('Token expired. Please log in again', 401);
  }

  // Development error response
  if (process.env.NODE_ENV === 'development') {
    return res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
      error: err,
      stack: err.stack,
    });
  }

  // Production error response - don't leak error details
  if (err.isOperational) {
    // Known operational errors
    return res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
    });
  }

  // Unknown errors
  return res.status(500).json({
    status: 'error',
    message: 'Something went wrong',
  });
};

export default AppError