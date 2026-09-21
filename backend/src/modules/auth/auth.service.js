import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import User from '../users/user.model.js';
import env from '../../config/env.config.js';
import { AppError } from '../../utils/errors.js';
import { generateAccessToken, generateRefreshToken } from '../../utils/generateToken.js';

export async function registerUser({ name, email, password, roles }) {
  if (await User.exists({ email })) throw new AppError('Email is already registered', 409);

  const selectedRoles = roles?.length ? [...new Set(roles)] : ['client'];
  const user = await User.create({
    name,
    email,
    passwordHash: password,
    roles: selectedRoles,
    activeRole: selectedRoles[0],
    isAdmin: Boolean(env.ADMIN_EMAIL && email === env.ADMIN_EMAIL),
  });

  const accessToken = generateAccessToken(user._id);
  const refreshToken = generateRefreshToken(user._id);
  user.refreshToken = refreshToken;
  await user.save({ validateBeforeSave: false });
  return { user, accessToken, refreshToken };
}

export async function loginUser({ email, password }) {
  const user = await User.findOne({ email }).select('+passwordHash');
  if (!user || !(await user.comparePassword(password))) throw new AppError('Invalid email or password', 401);
  if (user.status === 'suspended') throw new AppError('This account has been suspended', 403);
  if (env.ADMIN_EMAIL && email === env.ADMIN_EMAIL && !user.isAdmin) {
    user.isAdmin = true;
  }

  const accessToken = generateAccessToken(user._id);
  const refreshToken = generateRefreshToken(user._id);
  user.refreshToken = refreshToken;
  await user.save({ validateBeforeSave: false });
  return { user, accessToken, refreshToken };
}

export async function refreshAccessToken(refreshToken) {
  if (!refreshToken) throw new AppError('Refresh token is required', 401);
  let decoded;
  try { decoded = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET); }
  catch { throw new AppError('Invalid or expired refresh token', 401); }

  const user = await User.findById(decoded.userId).select('+refreshToken');
  if (!user || user.refreshToken !== refreshToken || user.status !== 'active') {
    throw new AppError('Refresh token is invalid', 401);
  }
  return generateAccessToken(user._id);
}

export async function logoutUser(userId) {
  await User.findByIdAndUpdate(userId, { refreshToken: null });
}

export async function forgotPassword(email) {
  const user = await User.findOne({ email });
  if (!user) return null;

  const resetToken = crypto.randomBytes(24).toString('hex');
  user.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
  user.passwordResetExpires = Date.now() + 10 * 60 * 1000;
  await user.save({ validateBeforeSave: false });
  if (env.NODE_ENV === 'development') console.log(`Password reset token for ${email}: ${resetToken}`);
  return resetToken;
}

export async function resetPassword(token, password) {
  const hashed = crypto.createHash('sha256').update(token).digest('hex');
  const user = await User.findOne({
    passwordResetToken: hashed,
    passwordResetExpires: { $gt: Date.now() },
  }).select('+passwordResetToken +passwordResetExpires');
  if (!user) throw new AppError('Token is invalid or has expired', 400);

  user.passwordHash = password;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  user.refreshToken = undefined;
  await user.save();
}
