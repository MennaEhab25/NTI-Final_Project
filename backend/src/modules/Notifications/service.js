import Notification from './notification.model.js';
import { getIO } from '../../utils/socket.js';

export const create = async ({ userId, type, message, data = {} }) => {
  const notification = await Notification.create({ user: userId, type, message, data });
  getIO()?.to(`user:${userId}`).emit('notification:new', notification);
  return notification;
};

export const listForUser = (userId) =>
  Notification.find({ user: userId }).sort({ createdAt: -1 }).limit(50);

export const markRead = (id, userId) =>
  Notification.findOneAndUpdate({ _id: id, user: userId }, { isRead: true }, { new: true });

export const markAllRead = (userId) =>
  Notification.updateMany({ user: userId, isRead: false }, { isRead: true });

export const notify = async (payload) => {
  try {
    return await create(payload);
  } catch (err) {
    console.error('Notification failed:', err.message);
    return null;
  }
};