import http from 'http';
import { Server } from 'socket.io';
import app from './app.js';
import env from './config/env.config.js';
import { connectDatabase } from './config/db.config.js';
import registerChatSocket from './modules/chat/chat.socket.js';
import { setIO } from './utils/socket.js';
import registerNotificationSocket from './modules/notifications/notification.socket.js';
import socketAuth from './middleware/socketAuth.middleware.js';

const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: env.FRONTEND_URL },
});

registerChatSocket(io);

setIO(io);
registerNotificationSocket(io);


socketAuth(io);
registerChatSocket(io);
setIO(io);
registerNotificationSocket(io);



connectDatabase()
  .then(() =>
    server.listen(env.PORT, () =>
      console.log(`API running on http://localhost:${env.PORT}`)
    )
  )
  .catch((error) => {
    console.error('Could not start server:', error.message);
    process.exit(1);
  });