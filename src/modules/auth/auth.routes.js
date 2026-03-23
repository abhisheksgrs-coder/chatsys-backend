const router = require('express').Router();
const controller = require('./auth.controller');
const { registerRules, loginRules } = require('./auth.validator');
const { validate } = require('../../middleware/validate');
const { authenticate } = require('../../middleware/auth');
const { authLimiter } = require('../../middleware/rateLimiter');

router.post('/register', authLimiter, registerRules, validate, controller.register);
router.post('/login',    authLimiter, loginRules,    validate, controller.login);
router.post('/logout',   authenticate, controller.logout);
router.get('/me',        authenticate, controller.getMe);

module.exports = router;
