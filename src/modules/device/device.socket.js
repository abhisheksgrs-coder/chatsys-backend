const deviceService = require('./device.service');
const logger        = require('../../utils/logger');

// Room name for a user's device(s)
function deviceRoom(userId) {
  return `device:${userId}`;
}

// mainIo = main namespace, deviceNsIo = /device namespace
let _mainIo = null;
let _deviceNs = null;
function setMainIo(io) { _mainIo = io; }
function setDeviceNs(ns) { _deviceNs = ns; }

// Emit to a user's device(s) from anywhere in the backend
function emitToDevice(userId, event, data) {
  _deviceNs?.to(deviceRoom(userId)).emit(event, data);
}

function registerDeviceHandlers(deviceNs, socket) {
  // Pi authenticates with its device_token
  socket.on('device_auth', async ({ deviceToken }, ack) => {
    try {
      const device = await deviceService.getDeviceByToken(deviceToken);
      if (!device) return ack?.({ ok: false, message: 'Invalid device token' });

      socket.deviceUserId = device.user_id;
      socket.deviceToken  = deviceToken;

      // Join device room inside device namespace
      socket.join(deviceRoom(device.user_id));

      await deviceService.setOnline(deviceToken, true);
      logger.info(`Device online: userId=${device.user_id}`);

      // Notify user's app (main namespace) that device came online
      _mainIo?.to(`user:${device.user_id}`).emit('device_status', { isOnline: true });

      ack?.({ ok: true, deviceName: device.device_name });
    } catch (err) {
      logger.error('device_auth error:', err);
      ack?.({ ok: false });
    }
  });

  // Pi sends heartbeat every 30s
  socket.on('device_ping', () => {
    if (socket.deviceToken) {
      deviceService.setOnline(socket.deviceToken, true).catch(() => {});
    }
  });

  // On disconnect, mark device offline
  socket.on('disconnect', async () => {
    if (socket.deviceToken) {
      await deviceService.setOnline(socket.deviceToken, false).catch(() => {});
      if (socket.deviceUserId) {
        _mainIo?.to(`user:${socket.deviceUserId}`).emit('device_status', { isOnline: false });
        logger.info(`Device offline: userId=${socket.deviceUserId}`);
      }
    }
  });
}

module.exports = { registerDeviceHandlers, deviceRoom, emitToDevice, setMainIo, setDeviceNs };
