const router = require('express').Router();
const controller = require('./friend.controller');
const { authenticate } = require('../../middleware/auth');

router.get('/',                        authenticate, controller.listFriends);
router.post('/request',                authenticate, controller.sendRequest);
router.get('/requests/pending',        authenticate, controller.getPendingRequests);
router.patch('/request/:id/accept',    authenticate, controller.acceptRequest);
router.patch('/request/:id/reject',    authenticate, controller.rejectRequest);
router.delete('/:friendId',            authenticate, controller.removeFriend);

module.exports = router;
