const authService = require('./auth.service');
const { success, created, error } = require('../../utils/response');

async function register(req, res, next) {
  try {
    const { mobile, pin, username } = req.body;
    const result = await authService.register({ mobile, pin, username });
    return created(res, result, 'Registration successful');
  } catch (err) {
    next(err);
  }
}

async function login(req, res, next) {
  try {
    const { mobile, pin } = req.body;
    const result = await authService.login({ mobile, pin });
    return success(res, result, 'Login successful');
  } catch (err) {
    next(err);
  }
}

async function logout(req, res) {
  // JWT is stateless — client discards the token.
  // For production, add a token blacklist here.
  return success(res, {}, 'Logged out successfully');
}

async function getMe(req, res, next) {
  try {
    const user = await authService.getMe(req.user.id);
    return success(res, { user });
  } catch (err) {
    next(err);
  }
}

module.exports = { register, login, logout, getMe };
