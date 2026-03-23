const router     = require('express').Router();
const controller = require('./chat.controller');
const { authenticate } = require('../../middleware/auth');
const { chatFileUpload } = require('../../middleware/upload');

router.get('/unread',                   authenticate, controller.getUnreadCounts);
router.post('/upload',                  authenticate, chatFileUpload.single('file'), controller.uploadChatFile);
router.get('/:friendId/messages',       authenticate, controller.getMessages);
router.post('/:friendId/messages',      authenticate, controller.sendMessage);
router.get('/:friendId/search',         authenticate, controller.searchMessages);

module.exports = router;
