const { pool } = require('../../config/database');

async function getPermission(userId, friendId) {
  const [rows] = await pool.query(
    `SELECT is_allowed FROM sync_permissions WHERE user_id = ? AND friend_id = ?`,
    [userId, friendId]
  );
  return rows[0] || null;
}

async function setPermission(userId, friendId, isAllowed) {
  await pool.query(
    `INSERT INTO sync_permissions (user_id, friend_id, is_allowed)
     VALUES (?, ?, ?)
     ON DUPLICATE KEY UPDATE is_allowed = VALUES(is_allowed), updated_at = NOW()`,
    [userId, friendId, isAllowed ? 1 : 0]
  );
}

async function listPermissions(userId) {
  const [rows] = await pool.query(
    `SELECT sp.friend_id AS friendId, sp.is_allowed AS isAllowed,
            u.username, u.avatar_url AS avatarUrl
     FROM sync_permissions sp
     JOIN users u ON u.id = sp.friend_id
     WHERE sp.user_id = ?`,
    [userId]
  );
  return rows;
}

async function logSyncEvent({ initiatorId, receiverId, videoId, eventType, timestampSec }) {
  await pool.query(
    `INSERT INTO sync_events (initiator_id, receiver_id, video_id, event_type, timestamp_sec)
     VALUES (?, ?, ?, ?, ?)`,
    [initiatorId, receiverId, videoId, eventType, timestampSec]
  );
}

module.exports = { getPermission, setPermission, listPermissions, logSyncEvent };
