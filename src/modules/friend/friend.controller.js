const friendService = require('./friend.service');
const { success, created } = require('../../utils/response');

async function sendRequest(req, res, next) {
  try {
    const { receiverId } = req.body;
    const result = await friendService.sendRequest(req.user.id, parseInt(receiverId, 10));
    return created(res, result, 'Friend request sent');
  } catch (err) { next(err); }
}

async function getPendingRequests(req, res, next) {
  try {
    const requests = await friendService.getPendingRequests(req.user.id);
    return success(res, { requests });
  } catch (err) { next(err); }
}

async function acceptRequest(req, res, next) {
  try {
    const result = await friendService.acceptRequest(parseInt(req.params.id, 10), req.user.id);
    return success(res, result, 'Friend request accepted');
  } catch (err) { next(err); }
}

async function rejectRequest(req, res, next) {
  try {
    await friendService.rejectRequest(parseInt(req.params.id, 10), req.user.id);
    return success(res, {}, 'Friend request rejected');
  } catch (err) { next(err); }
}

async function listFriends(req, res, next) {
  try {
    const friends = await friendService.listFriends(req.user.id);
    return success(res, { friends });
  } catch (err) { next(err); }
}

async function removeFriend(req, res, next) {
  try {
    await friendService.removeFriend(req.user.id, parseInt(req.params.friendId, 10));
    return success(res, {}, 'Friend removed');
  } catch (err) { next(err); }
}

module.exports = { sendRequest, getPendingRequests, acceptRequest, rejectRequest, listFriends, removeFriend };
