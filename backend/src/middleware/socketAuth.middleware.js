import jwt from 'jsonwebtoken';
import env from '../config/env.config.js';
import User from '../modules/users/user.model.js';

export default function socketAuth(io) {
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error('Please login first'));

      const decoded = jwt.verify(token, env.JWT_SECRET);
      const user = await User.findById(decoded.userId);
      if (!user || user.status !== 'active') return next(new Error('User is not available'));

      socket.userId = String(user._id);
      next();
    } catch {
      next(new Error('Invalid or expired token'));
    }
  });
}