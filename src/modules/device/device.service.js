const { pool } = require('../../config/database');
const crypto   = require('crypto');

function generateToken() {
  return crypto.randomBytes(32).toString('hex');
}

async function getOrCreateDevice(userId, deviceName = 'My Device') {
  const [rows] = await pool.query(
    'SELECT * FROM devices WHERE user_id = ? LIMIT 1',
    [userId]
  );
  if (rows[0]) return rows[0];

  const token = generateToken();
  await pool.query(
    'INSERT INTO devices (user_id, device_token, device_name) VALUES (?, ?, ?)',
    [userId, token, deviceName]
  );
  const [created] = await pool.query(
    'SELECT * FROM devices WHERE user_id = ? LIMIT 1', [userId]
  );
  return created[0];
}

async function getDeviceByToken(token) {
  const [rows] = await pool.query(
    'SELECT * FROM devices WHERE device_token = ? LIMIT 1', [token]
  );
  return rows[0] || null;
}

async function getDeviceByUserId(userId) {
  const [rows] = await pool.query(
    'SELECT * FROM devices WHERE user_id = ? LIMIT 1', [userId]
  );
  return rows[0] || null;
}

async function setOnline(deviceToken, online) {
  await pool.query(
    'UPDATE devices SET is_online = ?, last_seen = NOW() WHERE device_token = ?',
    [online ? 1 : 0, deviceToken]
  );
}

async function regenerateToken(userId) {
  const token = generateToken();
  await pool.query(
    'UPDATE devices SET device_token = ? WHERE user_id = ?', [token, userId]
  );
  return token;
}

module.exports = { getOrCreateDevice, getDeviceByToken, getDeviceByUserId, setOnline, regenerateToken };
