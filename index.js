require('dotenv').config();
const http = require('http');
const { Server } = require('socket.io');
const app = require('./src/app');
const env = require('./src/config/env');
const { testConnection } = require('./src/config/database');
const { initSocket } = require('./src/socket/index');
const logger = require('./src/utils/logger');

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: env.cors.allowedOrigins,
    methods: ['GET', 'POST'],
    credentials: true,
  },
  pingTimeout: 30000,
  pingInterval: 10000,
});

// Initialize Socket.IO handlers
initSocket(io);

async function start() {
  try {
    await testConnection();

    server.listen(env.port, () => {
      logger.info(`Server running on port ${env.port} [${env.nodeEnv}]`);
    });
  } catch (err) {
    logger.error('Failed to start server:', err);
    process.exit(1);
  }
}

start();
