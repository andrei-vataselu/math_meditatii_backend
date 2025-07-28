const logger = require('../utils/logger');

module.exports = (err, req, res, next) => {
  // Log the error with context
  logger.logApiError(err, req, {
    userId: req.userId,
    timestamp: new Date().toISOString()
  });

  // Don't leak error details in production
  const isDevelopment = process.env.NODE_ENV !== 'production';
  
  // Default error response
  let status = err.status || err.statusCode || 500;
  let message = 'Internal Server Error';
  let details = null;

  // Handle specific error types
  if (err.name === 'ValidationError') {
    status = 400;
    message = 'Validation Error';
    if (isDevelopment) {
      details = Object.values(err.errors).map(e => e.message);
    }
  } else if (err.name === 'CastError') {
    status = 400;
    message = 'Invalid ID format';
  } else if (err.code === 11000) {
    status = 409;
    message = 'Duplicate field value';
    if (isDevelopment) {
      const field = Object.keys(err.keyValue)[0];
      details = `${field} already exists`;
    }
  } else if (err.name === 'JsonWebTokenError') {
    status = 401;
    message = 'Invalid token';
  } else if (err.name === 'TokenExpiredError') {
    status = 401;
    message = 'Token expired';
  } else if (status < 500 && err.message) {
    // Client errors - safe to show message
    message = err.message;
  }

  // Always log full error internally, but never expose stack trace to client in prod
  logger.error({
    error: err.message,
    stack: isDevelopment ? err.stack : undefined,
    path: req.path,
    user: req.user ? req.user._id : undefined
  });
  
  // Prepare response
  const response = {
    error: 'ServerError',
    message
  };
  
  // Add details in development
  if (isDevelopment) {
    response.details = details;
    response.stack = err.stack;
  }
  
  res.status(status).json(response);
};