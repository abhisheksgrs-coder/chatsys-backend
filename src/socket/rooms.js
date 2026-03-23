/**
 * Room naming conventions.
 * All room names are deterministic so both users always resolve to the same string.
 */

function userRoom(userId) {
  return `user:${userId}`;
}

function chatRoom(userIdA, userIdB) {
  const [a, b] = [userIdA, userIdB].map(Number).sort((x, y) => x - y);
  return `chat:${a}_${b}`;
}

function syncRoom(userIdA, userIdB) {
  const [a, b] = [userIdA, userIdB].map(Number).sort((x, y) => x - y);
  return `sync:${a}_${b}`;
}

module.exports = { userRoom, chatRoom, syncRoom };
