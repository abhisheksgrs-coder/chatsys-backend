const syncService    = require('./sync.service');
const { userRoom }   = require('../../socket/rooms');
const { emitToDevice } = require('../device/device.socket');
const logger         = require('../../utils/logger');

function registerSyncHandlers(io, socket) {
  const initiatorId = socket.user.id;

  // --- Request permission to sync ---
  socket.on('music_sync_request', async (data) => {
    try {
      const { receiverId, videoId, videoTitle, thumbnailUrl } = data;
      if (!receiverId || !videoId) return;

      // Check if permission already granted
      const perm = await syncService.getPermission(receiverId, initiatorId);

      if (perm && perm.is_allowed) {
        // Ensure reverse permission exists so both users can control playback
        const reverseP = await syncService.getPermission(initiatorId, receiverId);
        if (!reverseP || !reverseP.is_allowed) {
          await syncService.setPermission(initiatorId, receiverId, true);
        }
        // Auto-approve: notify initiator to proceed
        socket.emit('music_sync_accepted', { receiverId, videoId, autoApproved: true });
      } else {
        // Send permission popup to receiver
        io.to(userRoom(receiverId)).emit('music_sync_request', {
          initiatorId,
          videoId,
          videoTitle,
          thumbnailUrl,
        });
      }
    } catch (err) {
      logger.error('music_sync_request error:', err);
    }
  });

  // --- Receiver accepts ---
  socket.on('music_sync_accept', async ({ initiatorId: initId, videoId }) => {
    try {
      // Save permission both ways so either user can control playback
      await syncService.setPermission(socket.user.id, initId, true); // receiver grants to initiator
      await syncService.setPermission(initId, socket.user.id, true); // initiator grants to receiver

      // Notify initiator
      io.to(userRoom(initId)).emit('music_sync_accepted', {
        receiverId: socket.user.id,
        videoId,
      });
    } catch (err) {
      logger.error('music_sync_accept error:', err);
    }
  });

  // --- Receiver declines ---
  socket.on('music_sync_decline', ({ initiatorId: initId }) => {
    io.to(userRoom(initId)).emit('music_sync_declined', { receiverId: socket.user.id });
  });

  // --- Play ---
  socket.on('music_sync_play', async (data) => {
    try {
      const { receiverId, videoId, currentTimestamp } = data;
      const perm = await syncService.getPermission(receiverId, initiatorId);
      if (!perm || !perm.is_allowed) return;

      const event = { videoId, currentTimestamp, serverTime: Date.now() };
      io.to(userRoom(receiverId)).emit('music_sync_play', event);

      // Forward to both users' hardware devices
      emitToDevice(initiatorId, 'music_play', { videoId, seekTo: currentTimestamp || 0 });
      emitToDevice(receiverId,  'music_play', { videoId, seekTo: currentTimestamp || 0 });

      await syncService.logSyncEvent({
        initiatorId,
        receiverId,
        videoId,
        eventType: 'play',
        timestampSec: currentTimestamp,
      });
    } catch (err) {
      logger.error('music_sync_play error:', err);
    }
  });

  // --- Pause ---
  socket.on('music_sync_pause', async ({ receiverId, videoId, currentTimestamp }) => {
    try {
      const perm = await syncService.getPermission(receiverId, initiatorId);
      if (!perm || !perm.is_allowed) return;

      io.to(userRoom(receiverId)).emit('music_sync_pause', {
        videoId,
        currentTimestamp,
        serverTime: Date.now(),
      });

      await syncService.logSyncEvent({
        initiatorId, receiverId, videoId, eventType: 'pause', timestampSec: currentTimestamp,
      });
    } catch (err) {
      logger.error('music_sync_pause error:', err);
    }
  });

  // --- Seek ---
  socket.on('music_sync_seek', async ({ receiverId, videoId, seekToTimestamp }) => {
    try {
      const perm = await syncService.getPermission(receiverId, initiatorId);
      if (!perm || !perm.is_allowed) return;

      io.to(userRoom(receiverId)).emit('music_sync_seek', {
        videoId,
        seekToTimestamp,
        serverTime: Date.now(),
      });

      await syncService.logSyncEvent({
        initiatorId, receiverId, videoId, eventType: 'seek', timestampSec: seekToTimestamp,
      });
    } catch (err) {
      logger.error('music_sync_seek error:', err);
    }
  });

  // --- Stop ---
  socket.on('music_sync_stop', ({ receiverId }) => {
    io.to(userRoom(receiverId)).emit('music_sync_stop', {});
    // Stop music on both devices
    emitToDevice(initiatorId, 'music_stop', {});
    emitToDevice(receiverId,  'music_stop', {});
  });

  // --- Heartbeat (drift correction) ---
  socket.on('music_sync_heartbeat', async ({ receiverId, videoId, currentTimestamp }) => {
    try {
      const perm = await syncService.getPermission(receiverId, initiatorId);
      if (!perm || !perm.is_allowed) return;

      io.to(userRoom(receiverId)).emit('music_sync_heartbeat', {
        videoId,
        currentTimestamp,
        serverTime: Date.now(),
      });
    } catch (err) {
      logger.error('music_sync_heartbeat error:', err);
    }
  });
}

module.exports = registerSyncHandlers;
