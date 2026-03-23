const { pool } = require('../../config/database');

async function searchByMobile(mobile, requesterId) {
  const [rows] = await pool.query(
    `SELECT id, mobile, username, avatar_url
     FROM users
     WHERE mobile = ? AND id != ? AND is_active = 1`,
    [mobile, requesterId]
  );
  return rows[0] || null;
}

async function updateProfile(userId, { username, avatarUrl }) {
  const fields = [];
  const values = [];

  if (username) {
    fields.push('username = ?');
    values.push(username);
  }
  if (avatarUrl !== undefined) {
    fields.push('avatar_url = ?');
    values.push(avatarUrl);
  }

  if (fields.length === 0) {
    const err = new Error('Nothing to update');
    err.statusCode = 400;
    throw err;
  }

  values.push(userId);
  await pool.query(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`, values);

  const [rows] = await pool.query(
    'SELECT id, mobile, username, avatar_url FROM users WHERE id = ?',
    [userId]
  );
  return rows[0];
}

module.exports = { searchByMobile, updateProfile };
