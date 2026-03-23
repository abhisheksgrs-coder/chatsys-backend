const chatService = require('./chat.service');
const { success } = require('../../utils/response');
const path = require('path');
const env = require('../../config/env');

function fileUrl(req, filename) {
  const base = process.env.SERVER_URL || `http://localhost:${process.env.PORT || 5000}`;
  return `${base}/uploads/files/${filename}`;
}

async function getMessages(req, res, next) {
  try {
    const userId   = req.user.id;
    const friendId = parseInt(req.params.friendId, 10);
    const limit    = parseInt(req.query.limit, 10) || 50;
    const beforeId = req.query.before ? parseInt(req.query.before, 10) : null;

    const messages = await chatService.getMessages({ userId, friendId, limit, beforeId });
    return success(res, { messages });
  } catch (err) { next(err); }
}

async function sendMessage(req, res, next) {
  try {
    const { messageText, messageType = 'text', videoId } = req.body;
    const senderId   = req.user.id;
    const receiverId = parseInt(req.params.friendId, 10);

    const message = await chatService.saveMessage({
      senderId, receiverId, messageText, messageType, videoId,
    });
    return success(res, { message }, 'Message sent');
  } catch (err) { next(err); }
}

async function getUnreadCounts(req, res, next) {
  try {
    const counts = await chatService.getUnreadCounts(req.user.id);
    return success(res, { counts });
  } catch (err) { next(err); }
}

async function searchMessages(req, res, next) {
  try {
    const userId   = req.user.id;
    const friendId = parseInt(req.params.friendId, 10);
    const query    = req.query.q || '';
    if (!query.trim()) return success(res, { messages: [] });

    const messages = await chatService.searchMessages({ userId, friendId, query });
    return success(res, { messages });
  } catch (err) { next(err); }
}

async function uploadChatFile(req, res, next) {
  try {
    if (!req.file) return res.status(400).json({ ok: false, message: 'No file uploaded' });
    const base = process.env.SERVER_URL || `http://localhost:${process.env.PORT || 5000}`;
    const url  = `${base}/uploads/files/${req.file.filename}`;
    return success(res, { url, fileName: req.file.originalname, fileType: req.file.mimetype });
  } catch (err) { next(err); }
}

module.exports = { getMessages, sendMessage, getUnreadCounts, searchMessages, uploadChatFile };
