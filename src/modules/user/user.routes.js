const router     = require('express').Router();
const controller = require('./user.controller');
const { authenticate } = require('../../middleware/auth');
const { avatarUpload } = require('../../middleware/upload');

router.get('/search',       authenticate, controller.searchByMobile);
router.patch('/me',         authenticate, controller.updateProfile);
router.post('/me/avatar',   authenticate, avatarUpload.single('avatar'), controller.uploadAvatar);

module.exports = router;
