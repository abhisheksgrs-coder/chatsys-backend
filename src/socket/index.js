const { verifyToken } = require('../utils/jwt');
const { userRoom } = require('./rooms');
const { setOnline, setOffline, isOnline, broadcastPresence } = require('./presence');
const logger = require('../utils/logger');
const { listFriends } = require('../modules/friend/friend.service');
const { pool } = require('../config/database');

// Import module-level socket handlers
const registerChatHandlers   = require('../modules/chat/chat.socket');
const registerSyncHandlers   = require('../modules/sync/sync.socket');
const { registerDeviceHandlers, setMainIo, setDeviceNs } = require('../modules/device/device.socket');

function initSocket(io) {
  // --- Device namespace (Raspberry Pi) — no JWT needed ---
  setMainIo(io);
  const deviceNs = io.of('/device');
  setDeviceNs(deviceNs);
  deviceNs.on('connection', (socket) => {
    logger.debug(`Device socket connected: ${socket.id}`);
    registerDeviceHandlers(deviceNs, socket);
  });

  // --- JWT Auth on handshake ---
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.query?.token;
    if (!token) return next(new Error('Authentication required'));

    try {
      const decoded = verifyToken(token);
      socket.user = decoded; // { id, mobile, username }
      next();
    } catch {
      next(new Error('Invalid or expired token'));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.user.id;
    logger.debug(`Socket connected: userId=${userId} socketId=${socket.id}`);

    // Join personal room
    socket.join(userRoom(userId));

    // Mark online and broadcast to others
    setOnline(userId, socket.id);
    broadcastPresence(io, userId, 'online');

    // Tell this user which of their friends are already online
    listFriends(userId).then((friends) => {
      friends.forEach((f) => {
        if (isOnline(f.id)) {
          socket.emit('user_online', { userId: f.id });
        }
      });
    }).catch(() => {});

    // Register feature handlers
    registerChatHandlers(io, socket);
    registerSyncHandlers(io, socket);

    socket.on('disconnect', () => {
      setOffline(userId, socket.id);
      broadcastPresence(io, userId, 'offline');
      // Save last_seen timestamp
      pool.query('UPDATE users SET last_seen = NOW() WHERE id = ?', [userId]).catch(() => {});
      logger.debug(`Socket disconnected: userId=${userId}`);
    });
  });
}

module.exports = { initSocket };
