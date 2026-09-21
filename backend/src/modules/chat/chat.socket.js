import * as service from './chat.service.js';

export default function registerChatSocket(io) {
  io.on('connection', (socket) => {
    socket.on('join', (contractId) => {
      socket.join(`contract:${contractId}`);
    });

    socket.on('message:send', async ({ contractId, senderId, content }) => {
      try {
        const msg = await service.add({ contractId, senderId, content });
        io.to(`contract:${contractId}`).emit('message:new', msg);
      } catch (err) {
        socket.emit('message:error', { message: 'Could not send message' });
      }
    });
  });
}