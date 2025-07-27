require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const app = express();

// Security headers
app.use(helmet());

// CORS setup
app.use(cors({
  origin: process.env.CLIENT_URL,
  credentials: true,
}));

// Body parser
app.use(express.json());
app.use(cookieParser());

// Rate limiting (global, can override per route)
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
}));

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