require('dotenv').config();

// DB_PASSWORD is optional (empty string is valid for local dev)
const required = ['DB_HOST', 'DB_NAME', 'DB_USER', 'JWT_SECRET'];

required.forEach((key) => {
  if (!process.env[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
});

module.exports = {
  port: parseInt(process.env.PORT, 10) || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',

  db: {
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT, 10) || 3306,
    name: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
  },

  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },

  cors: {
    allowedOrigins: (process.env.ALLOWED_ORIGINS || '').split(',').map((o) => o.trim()),
  },
};
