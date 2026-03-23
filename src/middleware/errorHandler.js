const logger = require('../utils/logger');

function errorHandler(err, req, res, next) {
  logger.error(err);

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal server error';

  res.status(statusCode).json({ ok: false, message });
}

module.exports = { errorHandler };
