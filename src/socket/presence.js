const { userRoom } = require('./rooms');

// In-memory presence map: userId → Set of socketIds
const onlineUsers = new Map();

function setOnline(userId, socketId) {
  if (!onlineUsers.has(userId)) {
    onlineUsers.set(userId, new Set());
  }
  onlineUsers.get(userId).add(socketId);
}

function setOffline(userId, socketId) {
  const sockets = onlineUsers.get(userId);
  if (sockets) {
    sockets.delete(socketId);
    if (sockets.size === 0) {
      onlineUsers.delete(userId);
    }
  }
}

function isOnline(userId) {
  return onlineUsers.has(userId) && onlineUsers.get(userId).size > 0;
}

function broadcastPresence(io, userId, status) {
  // Notify all sockets in the user's personal room
  io.emit(`user_${status}`, { userId });
}

module.exports = { setOnline, setOffline, isOnline, broadcastPresence };
