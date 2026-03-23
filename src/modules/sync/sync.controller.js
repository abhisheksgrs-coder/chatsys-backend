const syncService = require('./sync.service');
const { success } = require('../../utils/response');

async function listPermissions(req, res, next) {
  try {
    const perms = await syncService.listPermissions(req.user.id);
    return success(res, { permissions: perms });
  } catch (err) { next(err); }
}

async function updatePermission(req, res, next) {
  try {
    const { isAllowed } = req.body;
    const friendId = parseInt(req.params.friendId, 10);
    await syncService.setPermission(req.user.id, friendId, isAllowed);
    return success(res, {}, 'Permission updated');
  } catch (err) { next(err); }
}

async function revokePermission(req, res, next) {
  try {
    const friendId = parseInt(req.params.friendId, 10);
    await syncService.setPermission(req.user.id, friendId, false);
    return success(res, {}, 'Permission revoked');
  } catch (err) { next(err); }
}

module.exports = { listPermissions, updatePermission, revokePermission };
