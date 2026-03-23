const router = require('express').Router();
const controller = require('./sync.controller');
const { authenticate } = require('../../middleware/auth');

router.get('/permissions',                 authenticate, controller.listPermissions);
router.put('/permissions/:friendId',       authenticate, controller.updatePermission);
router.delete('/permissions/:friendId',    authenticate, controller.revokePermission);

module.exports = router;
