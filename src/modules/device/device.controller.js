const deviceService  = require('./device.service');
const { success }    = require('../../utils/response');
const { emitToDevice } = require('./device.socket');

// GET /api/v1/devices/me — get or create device for logged-in user
async function getMyDevice(req, res, next) {
  try {
    const device = await deviceService.getOrCreateDevice(req.user.id);
    return success(res, {
      deviceToken: device.device_token,
      deviceName:  device.device_name,
      isOnline:    !!device.is_online,
      lastSeen:    device.last_seen,
    });
  } catch (err) { next(err); }
}

// POST /api/v1/devices/regenerate — get a new token (if token is compromised)
async function regenerateToken(req, res, next) {
  try {
    const token = await deviceService.regenerateToken(req.user.id);
    return success(res, { deviceToken: token });
  } catch (err) { next(err); }
}

// POST /api/v1/devices/update — push update to Pi
async function pushUpdate(req, res, next) {
  try {
    // Send just the path — Pi will prepend its own SERVER_URL
    emitToDevice(req.user.id, 'device_update', { scriptPath: '/device-script' });
    return success(res, {}, 'Update pushed to device');
  } catch (err) { next(err); }
}

module.exports = { getMyDevice, regenerateToken, pushUpdate };
