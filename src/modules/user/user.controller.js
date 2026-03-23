const userService = require('./user.service');
const { success, notFound } = require('../../utils/response');

async function searchByMobile(req, res, next) {
  try {
    const { mobile } = req.query;
    if (!mobile) return res.status(400).json({ ok: false, message: 'mobile query param required' });

    const user = await userService.searchByMobile(mobile, req.user.id);
    if (!user) return notFound(res, 'User not found');

    return success(res, { user });
  } catch (err) { next(err); }
}

async function updateProfile(req, res, next) {
  try {
    const { username, avatarUrl } = req.body;
    const user = await userService.updateProfile(req.user.id, { username, avatarUrl });
    return success(res, { user }, 'Profile updated');
  } catch (err) { next(err); }
}

async function uploadAvatar(req, res, next) {
  try {
    if (!req.file) return res.status(400).json({ ok: false, message: 'No file uploaded' });
    const base = process.env.SERVER_URL || `http://localhost:${process.env.PORT || 5000}`;
    const avatarUrl = `${base}/uploads/avatars/${req.file.filename}`;
    const user = await userService.updateProfile(req.user.id, { avatarUrl });
    return success(res, { user, avatarUrl }, 'Avatar updated');
  } catch (err) { next(err); }
}

module.exports = { searchByMobile, updateProfile, uploadAvatar };
