const { userRoom } = require('../../socket/rooms');

function registerCallHandlers(io, socket) {
  const callerId = socket.user.id;

  socket.on('call_offer', ({ receiverId, offer, callType }) => {
    const room = userRoom(receiverId);
    console.log(`[Call] call_offer: callerId=${callerId} receiverId=${receiverId} room=${room} type=${callType}`);
    io.to(room).emit('call_incoming', {
      callerId,
      callerName: socket.user.username,
      offer,
      callType,
    });
    console.log(`[Call] call_incoming emitted to ${room}`);
  });

  socket.on('call_answer', ({ callerId: targetId, answer }) => {
    console.log(`[Call] call_answer: ${callerId} → ${targetId}`);
    io.to(userRoom(targetId)).emit('call_answered', { answer });
  });

  socket.on('call_ice', ({ targetId, candidate }) => {
    io.to(userRoom(targetId)).emit('call_ice', { candidate });
  });

  socket.on('call_reject', ({ callerId: targetId }) => {
    console.log(`[Call] call_reject: ${callerId} → ${targetId}`);
    io.to(userRoom(targetId)).emit('call_rejected');
  });

  socket.on('call_end', ({ targetId }) => {
    console.log(`[Call] call_end: ${callerId} → ${targetId}`);
    io.to(userRoom(targetId)).emit('call_ended');
  });
}

module.exports = registerCallHandlers;
