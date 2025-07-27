require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const logger = require('./utils/logger');
const app = express();

// Trust proxy for Google Cloud Run / load balancers
app.set('trust proxy', 1);

// Enhanced security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false,
  referrerPolicy: { policy: "strict-origin-when-cross-origin" }
}));

// Enhanced CORS setup
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  optionsSuccessStatus: 200
}));

// Body parser
app.use(express.json());
app.use(cookieParser());

// Input sanitization (XSS, MongoDB injection)
app.use(require('./middlewares/sanitize'));

// Rate limiting (global, can override per route)
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
}));

// Health check endpoint
app.get('/healthz', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    version: process.env.npm_package_version || '1.0.0'
  });
});

// Stripe webhook raw body (must be before express.json for /stripe/webhook)
app.use('/stripe/webhook', require('express').raw({ type: 'application/json' }));

// Routers
app.use('/auth', require('./routes/auth'));
app.use('/user', require('./routes/user'));
app.use('/plans', require('./routes/plans'));
app.use('/stripe', require('./routes/stripe'));

// 404 global handler
app.use((req, res, next) => {
  res.status(404).json({ error: 'Not found', message: 'Ruta nu există sau nu este implementată.' });
});

// Error handler
app.use(require('./middlewares/errorHandler'));

module.exports = app; 