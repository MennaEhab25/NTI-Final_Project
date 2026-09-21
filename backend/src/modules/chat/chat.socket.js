import * as service from './chat.service.js';

export default function registerChatSocket(io) {
  io.on('connection', (socket) => {
    socket.on('join', async (contractId) => {
      try {
        await service.assertParticipant(contractId, socket.userId);
        socket.join(`contract:${contractId}`);
      } catch {
        socket.emit('message:error', { message: 'Cannot join this chat' });
      }
    });

    socket.on('message:send', async ({ contractId, content }) => {
      try {
        const msg = await service.add({ contractId, senderId: socket.userId, content });
        io.to(`contract:${contractId}`).emit('message:new', msg);
      } catch {
        socket.emit('message:error', { message: 'Could not send message' });
      }
    });
  });
}