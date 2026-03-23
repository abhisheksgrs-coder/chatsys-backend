const { pool } = require('../../config/database');

async function sendRequest(senderId, receiverId) {
  if (senderId === receiverId) {
    const err = new Error('Cannot add yourself'); err.statusCode = 400; throw err;
  }

  // Check already friends
  const [f] = await pool.query(
    'SELECT id FROM friends WHERE user_id = ? AND friend_id = ?',
    [senderId, receiverId]
  );
  if (f.length > 0) {
    const err = new Error('Already friends'); err.statusCode = 409; throw err;
  }

  // Check pending request
  const [existing] = await pool.query(
    `SELECT id, status FROM friend_requests
     WHERE (sender_id = ? AND receiver_id = ?)
        OR (sender_id = ? AND receiver_id = ?)`,
    [senderId, receiverId, receiverId, senderId]
  );
  if (existing.length > 0) {
    const err = new Error('Friend request already exists'); err.statusCode = 409; throw err;
  }

  const [result] = await pool.query(
    'INSERT INTO friend_requests (sender_id, receiver_id) VALUES (?, ?)',
    [senderId, receiverId]
  );

  return { id: result.insertId, senderId, receiverId, status: 'pending' };
}

async function getPendingRequests(userId) {
  const [rows] = await pool.query(
    `SELECT fr.id, fr.sender_id AS senderId, fr.created_at AS createdAt,
            u.username, u.avatar_url AS avatarUrl, u.mobile
     FROM friend_requests fr
     JOIN users u ON u.id = fr.sender_id
     WHERE fr.receiver_id = ? AND fr.status = 'pending'
     ORDER BY fr.created_at DESC`,
    [userId]
  );
  return rows;
}

async function acceptRequest(requestId, userId) {
  const [rows] = await pool.query(
    `SELECT * FROM friend_requests WHERE id = ? AND receiver_id = ? AND status = 'pending'`,
    [requestId, userId]
  );
  if (rows.length === 0) {
    const err = new Error('Request not found'); err.statusCode = 404; throw err;
  }

  const { sender_id: senderId, receiver_id: receiverId } = rows[0];

  await pool.query(
    `UPDATE friend_requests SET status = 'accepted' WHERE id = ?`,
    [requestId]
  );

  // Insert both directions into friends
  await pool.query(
    `INSERT IGNORE INTO friends (user_id, friend_id) VALUES (?, ?), (?, ?)`,
    [senderId, receiverId, receiverId, senderId]
  );

  return { requestId, senderId, receiverId };
}

async function rejectRequest(requestId, userId) {
  const [result] = await pool.query(
    `UPDATE friend_requests SET status = 'rejected'
     WHERE id = ? AND receiver_id = ? AND status = 'pending'`,
    [requestId, userId]
  );
  if (result.affectedRows === 0) {
    const err = new Error('Request not found'); err.statusCode = 404; throw err;
  }
}

async function listFriends(userId) {
  const [rows] = await pool.query(
    `SELECT u.id, u.username, u.mobile, u.avatar_url AS avatarUrl, u.last_seen AS lastSeen
     FROM friends f
     JOIN users u ON u.id = f.friend_id
     WHERE f.user_id = ? AND u.is_active = 1
     ORDER BY u.username ASC`,
    [userId]
  );
  return rows;
}

async function removeFriend(userId, friendId) {
  await pool.query(
    `DELETE FROM friends WHERE (user_id = ? AND friend_id = ?) OR (user_id = ? AND friend_id = ?)`,
    [userId, friendId, friendId, userId]
  );
}

module.exports = { sendRequest, getPendingRequests, acceptRequest, rejectRequest, listFriends, removeFriend };
