const bcrypt = require('bcrypt');

const SALT_ROUNDS = 10;

async function hashPin(pin) {
  return bcrypt.hash(String(pin), SALT_ROUNDS);
}

async function comparePin(pin, hash) {
  return bcrypt.compare(String(pin), hash);
}

module.exports = { hashPin, comparePin };
