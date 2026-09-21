import * as service from './auth.service.js';
import env from '../../config/env.config.js';
import { catchAsync } from '../../utils/catchAsync.js';
import { successResponse } from '../../utils/apiResponse.js';

function publicUser(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    roles: user.roles,
    activeRole: user.activeRole,
    isAdmin: user.isAdmin,
    avatarUrl: user.avatarUrl,
  };
}

export const register = catchAsync(async (req, res) => {
  const result = await service.registerUser(req.body);
  successResponse(res, 201, { user: publicUser(result.user), accessToken: result.accessToken, refreshToken: result.refreshToken }, 'Registered successfully');
});

export const login = catchAsync(async (req, res) => {
  const result = await service.loginUser(req.body);
  successResponse(res, 200, { user: publicUser(result.user), accessToken: result.accessToken, refreshToken: result.refreshToken }, 'Logged in successfully');
});

export const refresh = catchAsync(async (req, res) => {
  successResponse(res, 200, { accessToken: await service.refreshAccessToken(req.body.refreshToken) }, 'Token refreshed');
});

export const logout = catchAsync(async (req, res) => {
  await service.logoutUser(req.userId);
  successResponse(res, 200, null, 'Logged out successfully');
});

export const forgotPassword = catchAsync(async (req, res) => {
  const resetToken = await service.forgotPassword(req.body.email);
  const data = env.NODE_ENV === 'development' && resetToken ? { resetToken } : null;
  successResponse(res, 200, data, 'If this email is registered, a reset token has been created');
});

export const resetPassword = catchAsync(async (req, res) => {
  await service.resetPassword(req.body.token, req.body.password);
  successResponse(res, 200, null, 'Password has been reset successfully');
});
