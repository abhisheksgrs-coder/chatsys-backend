const mysql = require('mysql2/promise');
const env = require('./env');
const logger = require('../utils/logger');

const pool = mysql.createPool({
  host: env.db.host,
  port: env.db.port,
  database: env.db.name,
  user: env.db.user,
  password: env.db.password,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  timezone: '+00:00',
});

async function testConnection() {
  try {
    const conn = await pool.getConnection();
    logger.info('MySQL connected successfully');
    conn.release();
  } catch (err) {
    logger.error('MySQL connection failed:', err.message);
    throw err;
  }
}

module.exports = { pool, testConnection };
