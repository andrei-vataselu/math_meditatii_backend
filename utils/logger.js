const winston = require('winston');
const path = require('path');

// Define log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Define colors for each level
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white',
};

winston.addColors(colors);

const format = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.printf((info) => {
    const { timestamp, level, message, ...meta } = info;
    const sanitizedMeta = sanitizeLogData(meta);
    return JSON.stringify({ timestamp, level, message, ...sanitizedMeta });
  })
);

function sanitizeLogData(data) {
  const sensitiveFields = ['password', 'token', 'authorization', 'cookie', 'secret', 'key'];
  const sanitized = { ...data };
  const sanitizeObject = (obj) => {
    if (typeof obj !== 'object' || obj === null) return obj;
    const result = Array.isArray(obj) ? [] : {};
    for (const [key, value] of Object.entries(obj)) {
      const lowerKey = key.toLowerCase();
      if (sensitiveFields.some(field => lowerKey.includes(field))) {
        result[key] = '[REDACTED]';
      } else if (typeof value === 'object' && value !== null) {
        result[key] = sanitizeObject(value);
      } else {
        result[key] = value;
      }
    }
    return result;
  };
  return sanitizeObject(sanitized);
}

const transports = [];
if (process.env.NODE_ENV !== 'production') {
  transports.push(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize({ all: true }),
      winston.format.simple()
    ),
  }));
}
if (process.env.NODE_ENV === 'production') {
  transports.push(new winston.transports.File({
    filename: path.join('logs', 'error.log'),
    level: 'error',
    maxsize: 5242880,
    maxFiles: 5,
  }));
  transports.push(new winston.transports.File({
    filename: path.join('logs', 'combined.log'),
    maxsize: 5242880,
    maxFiles: 5,
  }));
}

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),
  levels,
  format,
  transports,
  exitOnError: false,
});

logger.stream = {
  write: (message) => {
    logger.http(message.trim());
  },
};

logger.logUserAction = (userId, action, metadata = {}) => {
  logger.info('User action', { userId, action, ...metadata });
};

logger.logPaymentEvent = (eventType, userId, metadata = {}) => {
  logger.info('Payment event', { eventType, userId, ...metadata });
};

logger.logSecurityEvent = (eventType, metadata = {}) => {
  logger.warn('Security event', { eventType, ...metadata });
};

logger.logApiError = (error, req, metadata = {}) => {
  logger.error('API Error', {
    error: error.message,
    stack: error.stack,
    method: req?.method,
    url: req?.url,
    userAgent: req?.get('User-Agent'),
    ip: req?.ip,
    ...metadata
  });
};

module.exports = logger;
