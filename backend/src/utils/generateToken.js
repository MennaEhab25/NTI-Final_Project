import jwt from 'jsonwebtoken';
import env from '../config/env.config.js';

export function generateAccessToken(userId) {
  return jwt.sign({ userId: String(userId) }, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN });
}

export function generateRefreshToken(userId) {
  return jwt.sign({ userId: String(userId) }, env.JWT_REFRESH_SECRET, { expiresIn: env.JWT_REFRESH_EXPIRES_IN });
}
