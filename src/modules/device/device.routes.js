const router     = require('express').Router();
const controller = require('./device.controller');
const { authenticate } = require('../../middleware/auth');

router.get('/me',          authenticate, controller.getMyDevice);
router.post('/regenerate', authenticate, controller.regenerateToken);
router.post('/update',     authenticate, controller.pushUpdate);

module.exports = router;
