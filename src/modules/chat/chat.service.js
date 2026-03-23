const { pool } = require('../../config/database');

async function saveMessage({ senderId, receiverId, messageText, messageType, videoId, fileUrl, fileName, fileType }) {
  const [result] = await pool.query(
    `INSERT INTO messages (sender_id, receiver_id, message_text, message_type, video_id, file_url, file_name, file_type)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [senderId, receiverId, messageText || null, messageType, videoId || null, fileUrl || null, fileName || null, fileType || null]
  );

  return {
    id: result.insertId,
    senderId,
    receiverId,
    messageText,
    messageType,
    videoId: videoId || null,
    fileUrl: fileUrl || null,
    fileName: fileName || null,
    fileType: fileType || null,
    isSeen: false,
    isDelivered: false,
    reactions: [],
    createdAt: new Date().toISOString(),
  };
}

async function markDelivered(messageId) {
  await pool.query(
    'UPDATE messages SET is_delivered = 1 WHERE id = ?',
    [messageId]
  );
}

async function getMessages({ userId, friendId, limit = 50, beforeId = null }) {
  let query = `
    SELECT m.id, m.sender_id AS senderId, m.receiver_id AS receiverId,
           m.message_text AS messageText, m.message_type AS messageType,
           m.video_id AS videoId, m.file_url AS fileUrl,
           m.file_name AS fileName, m.file_type AS fileType,
           m.is_seen AS isSeen, m.is_delivered AS isDelivered, m.created_at AS createdAt
    FROM messages m
    WHERE (m.sender_id = ? AND m.receiver_id = ?)
       OR (m.sender_id = ? AND m.receiver_id = ?)
  `;
  const params = [userId, friendId, friendId, userId];

  if (beforeId) {
    query += ' AND m.id < ?';
    params.push(beforeId);
  }

  query += ' ORDER BY m.id DESC LIMIT ?';
  params.push(limit);

  const [rows] = await pool.query(query, params);
  const messages = rows.reverse();

  // Attach reactions to each message
  if (messages.length > 0) {
    const ids = messages.map(m => m.id);
    const [reactions] = await pool.query(
      `SELECT message_id AS messageId, user_id AS userId, emoji
       FROM message_reactions WHERE message_id IN (?)`,
      [ids]
    );
    const reactionMap = {};
    reactions.forEach(r => {
      if (!reactionMap[r.messageId]) reactionMap[r.messageId] = [];
      reactionMap[r.messageId].push({ userId: r.userId, emoji: r.emoji });
    });
    messages.forEach(m => { m.reactions = reactionMap[m.id] || []; });
  }

  return messages;
}

async function markSeen(messageId, receiverId) {
  await pool.query(
    'UPDATE messages SET is_seen = 1 WHERE id = ? AND receiver_id = ?',
    [messageId, receiverId]
  );
}

async function getUnreadCounts(userId) {
  const [rows] = await pool.query(
    `SELECT sender_id AS friendId, COUNT(*) AS count
     FROM messages
     WHERE receiver_id = ? AND is_seen = 0
     GROUP BY sender_id`,
    [userId]
  );
  const counts = {};
  rows.forEach(r => { counts[r.friendId] = Number(r.count); });
  return counts;
}

async function searchMessages({ userId, friendId, query }) {
  const [rows] = await pool.query(
    `SELECT id, sender_id AS senderId, receiver_id AS receiverId,
            message_text AS messageText, message_type AS messageType,
            video_id AS videoId, file_url AS fileUrl, file_name AS fileName,
            is_seen AS isSeen, created_at AS createdAt
     FROM messages
     WHERE ((sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?))
       AND message_text LIKE ?
     ORDER BY id DESC
     LIMIT 50`,
    [userId, friendId, friendId, userId, `%${query}%`]
  );
  return rows.reverse();
}

async function addReaction(messageId, userId, emoji) {
  await pool.query(
    `INSERT INTO message_reactions (message_id, user_id, emoji)
     VALUES (?, ?, ?)
     ON DUPLICATE KEY UPDATE created_at = created_at`,
    [messageId, userId, emoji]
  );
}

async function removeReaction(messageId, userId, emoji) {
  await pool.query(
    `DELETE FROM message_reactions WHERE message_id = ? AND user_id = ? AND emoji = ?`,
    [messageId, userId, emoji]
  );
}

async function getMessageSenderReceiver(messageId) {
  const [rows] = await pool.query(
    'SELECT sender_id AS senderId, receiver_id AS receiverId FROM messages WHERE id = ?',
    [messageId]
  );
  return rows[0] || null;
}

module.exports = {
  saveMessage, getMessages, markSeen, markDelivered,
  getUnreadCounts, searchMessages,
  addReaction, removeReaction, getMessageSenderReceiver,
};
