export default function registerNotificationSocket(io) {
  io.on('connection', (socket) => {
    socket.join(`user:${socket.userId}`);
  });
}