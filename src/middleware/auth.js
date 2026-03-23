const { verifyToken } = require('../utils/jwt');
const { unauthorized } = require('../utils/response');

function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return unauthorized(res, 'No token provided');
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = verifyToken(token);
    req.user = decoded; // { id, mobile, username }
    next();
  } catch (err) {
    return unauthorized(res, 'Invalid or expired token');
  }
}

module.exports = { authenticate };
