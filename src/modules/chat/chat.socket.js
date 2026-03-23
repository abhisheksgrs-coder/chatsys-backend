const chatService    = require('./chat.service');
const { userRoom }   = require('../../socket/rooms');
const { isOnline }   = require('../../socket/presence');
const { emitToDevice } = require('../device/device.socket');
const logger         = require('../../utils/logger');

// keyword → { color, pattern, duration(ms) }
const LED_KEYWORDS = {
  'good morning':   { color: 'green',  pattern: 'sunrise', duration: 4000 },
  'good night':     { color: 'blue',   pattern: 'fade',    duration: 5000 },
  'happy birthday': { color: 'red',    pattern: 'party',   duration: 6000 },
  'i love you':     { color: 'red',    pattern: 'heart',   duration: 5000 },
  'hello':          { color: 'white',  pattern: 'wave',    duration: 2000 },
  'hi':             { color: 'white',  pattern: 'wave',    duration: 2000 },
};

function detectLedTrigger(text) {
  if (!text) return null;
  const lower = text.toLowerCase().trim();
  for (const [keyword, config] of Object.entries(LED_KEYWORDS)) {
    if (lower.includes(keyword)) return config;
  }
  return null;
}

function registerChatHandlers(io, socket) {
  const senderId = socket.user.id;

  // --- Send message ---
  socket.on('send_message', async (data, ack) => {
    try {
      const { receiverId, messageText, messageType = 'text', videoId = null,
              fileUrl = null, fileName = null, fileType = null } = data;

      if (!receiverId || (!messageText && messageType === 'text')) {
        return ack?.({ ok: false, message: 'Invalid message data' });
      }

      const message = await chatService.saveMessage({
        senderId, receiverId, messageText, messageType, videoId, fileUrl, fileName, fileType,
      });

      io.to(userRoom(receiverId)).emit('receive_message', message);

      // If receiver is online, they got it → notify sender of delivery and persist
      if (isOnline(receiverId)) {
        await chatService.markDelivered(message.id);
        io.to(userRoom(senderId)).emit('message_delivered', { messageId: message.id });
      }

      // LED keyword detection — trigger both users' devices
      const led = detectLedTrigger(messageText);
      if (led) {
        emitToDevice(senderId,   'led_trigger', led);
        emitToDevice(receiverId, 'led_trigger', led);
      }

      ack?.({ ok: true, message });
    } catch (err) {
      logger.error('send_message error:', err);
      ack?.({ ok: false, message: 'Failed to send message' });
    }
  });

  // --- Typing indicators ---
  socket.on('typing_start', ({ receiverId }) => {
    if (!receiverId) return;
    io.to(userRoom(receiverId)).emit('typing_start', { userId: senderId });
  });

  socket.on('typing_stop', ({ receiverId }) => {
    if (!receiverId) return;
    io.to(userRoom(receiverId)).emit('typing_stop', { userId: senderId });
  });

  // --- Seen status ---
  socket.on('message_seen', async ({ messageId, senderId: msgSenderId }) => {
    try {
      await chatService.markSeen(messageId, senderId);
      io.to(userRoom(msgSenderId)).emit('message_seen', { messageId });
    } catch (err) {
      logger.error('message_seen error:', err);
    }
  });

  // --- Emoji reaction: add ---
  socket.on('add_reaction', async ({ messageId, emoji }, ack) => {
    try {
      await chatService.addReaction(messageId, senderId, emoji);
      const msg = await chatService.getMessageSenderReceiver(messageId);
      if (!msg) return ack?.({ ok: false });

      const event = { messageId, userId: senderId, emoji, action: 'add' };
      // Notify the other user in the conversation
      const otherId = msg.senderId === senderId ? msg.receiverId : msg.senderId;
      io.to(userRoom(otherId)).emit('reaction_updated', event);
      ack?.({ ok: true, ...event });
    } catch (err) {
      logger.error('add_reaction error:', err);
      ack?.({ ok: false });
    }
  });

  // --- Emoji reaction: remove ---
  socket.on('remove_reaction', async ({ messageId, emoji }, ack) => {
    try {
      await chatService.removeReaction(messageId, senderId, emoji);
      const msg = await chatService.getMessageSenderReceiver(messageId);
      if (!msg) return ack?.({ ok: false });

      const event = { messageId, userId: senderId, emoji, action: 'remove' };
      const otherId = msg.senderId === senderId ? msg.receiverId : msg.senderId;
      io.to(userRoom(otherId)).emit('reaction_updated', event);
      ack?.({ ok: true, ...event });
    } catch (err) {
      logger.error('remove_reaction error:', err);
      ack?.({ ok: false });
    }
  });
}

module.exports = registerChatHandlers;
