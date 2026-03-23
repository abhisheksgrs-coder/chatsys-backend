const { pool } = require('../../config/database');
const { hashPin, comparePin } = require('../../utils/hash');
const { signToken } = require('../../utils/jwt');

async function register({ mobile, pin, username }) {
  // Check if mobile already exists
  const [existing] = await pool.query(
    'SELECT id FROM users WHERE mobile = ?',
    [mobile]
  );
  if (existing.length > 0) {
    const err = new Error('Mobile number already registered');
    err.statusCode = 409;
    throw err;
  }

  const pinHash = await hashPin(pin);

  const [result] = await pool.query(
    'INSERT INTO users (mobile, pin_hash, username) VALUES (?, ?, ?)',
    [mobile, pinHash, username]
  );

  const user = { id: result.insertId, mobile, username };
  const token = signToken(user);

  return { user, token };
}

async function login({ mobile, pin }) {
  const [rows] = await pool.query(
    'SELECT id, mobile, username, pin_hash, is_active FROM users WHERE mobile = ?',
    [mobile]
  );

  if (rows.length === 0) {
    const err = new Error('Invalid mobile number or PIN');
    err.statusCode = 401;
    throw err;
  }

  const dbUser = rows[0];

  if (!dbUser.is_active) {
    const err = new Error('Account is deactivated');
    err.statusCode = 403;
    throw err;
  }

  const pinMatch = await comparePin(pin, dbUser.pin_hash);
  if (!pinMatch) {
    const err = new Error('Invalid mobile number or PIN');
    err.statusCode = 401;
    throw err;
  }

  const user = { id: dbUser.id, mobile: dbUser.mobile, username: dbUser.username };
  const token = signToken(user);

  return { user, token };
}

async function getMe(userId) {
  const [rows] = await pool.query(
    'SELECT id, mobile, username, avatar_url, created_at FROM users WHERE id = ?',
    [userId]
  );

  if (rows.length === 0) {
    const err = new Error('User not found');
    err.statusCode = 404;
    throw err;
  }

  return rows[0];
}

module.exports = { register, login, getMe };
