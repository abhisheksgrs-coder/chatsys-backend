const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const env = require('./config/env');
const { apiLimiter } = require('./middleware/rateLimiter');
const { errorHandler } = require('./middleware/errorHandler');

// Route modules
const authRoutes   = require('./modules/auth/auth.routes');
const userRoutes   = require('./modules/user/user.routes');
const friendRoutes = require('./modules/friend/friend.routes');
const chatRoutes   = require('./modules/chat/chat.routes');
const syncRoutes   = require('./modules/sync/sync.routes');
const deviceRoutes = require('./modules/device/device.routes');

const app = express();

// Security
app.use(helmet());
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || env.cors.allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS blocked: ${origin}`));
    }
  },
  credentials: true,
}));

// Logging
if (env.nodeEnv !== 'test') {
  app.use(morgan('dev'));
}

// Body parsing
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files (avatars, chat files)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Serve latest device.py script for Pi auto-update
app.get('/device-script', (req, res) => {
  const scriptPath = path.join(__dirname, '../../device/device.py');
  res.download(scriptPath, 'device.py');
});

// Global rate limit
app.use('/api', apiLimiter);

// Health check
app.get('/health', (req, res) => res.json({ ok: true, uptime: process.uptime() }));

// API routes
app.use('/api/v1/auth',    authRoutes);
app.use('/api/v1/users',   userRoutes);
app.use('/api/v1/friends', friendRoutes);
app.use('/api/v1/chat',    chatRoutes);
app.use('/api/v1/sync',    syncRoutes);
app.use('/api/v1/devices', deviceRoutes);

// 404
app.use((req, res) => res.status(404).json({ ok: false, message: 'Route not found' }));

// Global error handler
app.use(errorHandler);

module.exports = app;
