// api-gateway/server.js
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { createProxyMiddleware } = require('http-proxy-middleware');
const rateLimit = require('express-rate-limit');
const logger = require('../shared-lib/logger');
require('dotenv').config();

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10kb' }));
app.use(morgan('dev'));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many requests from this IP, please try again after 15 minutes'
});
app.use('/api', limiter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'UP', service: 'api-gateway' });
});

// Service routes
// Auth Service
app.use('/api/auth', createProxyMiddleware({
  target: process.env.AUTH_SERVICE_URL || 'http://localhost:4001',
  changeOrigin: true,
  pathRewrite: {
    '^/api/auth': '/api/auth'
  },
  logProvider: () => logger
}));

// User Service
app.use('/api/users', createProxyMiddleware({
  target: process.env.USER_SERVICE_URL || 'http://localhost:4002',
  changeOrigin: true,
  pathRewrite: {
    '^/api/users': '/api/users'
  },
  logProvider: () => logger
}));

// Interview Service
app.use('/api/interviews', createProxyMiddleware({
  target: process.env.INTERVIEW_SERVICE_URL || 'http://localhost:4003',
  changeOrigin: true,
  pathRewrite: {
    '^/api/interviews': '/api/interviews'
  },
  logProvider: () => logger
}));

// Feedback Service
app.use('/api/feedback', createProxyMiddleware({
  target: process.env.FEEDBACK_SERVICE_URL || 'http://localhost:4004',
  changeOrigin: true,
  pathRewrite: {
    '^/api/feedback': '/api/feedback'
  },
  logProvider: () => logger
}));

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error(`API Gateway Error: ${err.message}`);
  res.status(500).json({
    success: false,
    message: 'Internal server error'
  });
});

// 404 middleware
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Start server
const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  logger.info(`API Gateway running on port ${PORT}`);
});

module.exports = app;