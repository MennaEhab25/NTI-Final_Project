import jwt from 'jsonwebtoken';
import env from '../config/env.config.js';
import User from '../modules/users/user.model.js';
import { AppError } from '../utils/errors.js';
import { catchAsync } from '../utils/catchAsync.js';

export const protect = catchAsync(async (req, res, next) => {
  const authHeader = req.headers.authorization || '';
  if (!authHeader.startsWith('Bearer ')) throw new AppError('Please login first', 401);

  let decoded;
  try {
    decoded = jwt.verify(authHeader.slice(7), env.JWT_SECRET);
  } catch {
    throw new AppError('Invalid or expired token', 401);
  }

  const user = await User.findById(decoded.userId);
  if (!user || user.status !== 'active') throw new AppError('User is not available', 401);

  req.user = user;
  req.userId = String(user._id);
  next();
});

export function requireAdmin(req, res, next) {
  if (!req.user?.isAdmin) return res.status(403).json({ success: false, message: 'Admin access required' });
  next();
}
