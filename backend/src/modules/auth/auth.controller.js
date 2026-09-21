// SCAFFOLD ONLY | Owner: Person 1. Implement here; not imported by the demo.
import * as authService from "./auth.service.js";
import { catchAsync } from "../../utils/catchAsync.js";
import { successResponse } from "../../utils/apiResponse.js";

export const register = catchAsync(async (req, res) => {
  const { user, accessToken, refreshToken } = await authService.registerUser(
    req.body,
  );

  successResponse(
    res,
    201,
    {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        roles: user.roles,
        activeRole: user.activeRole,
      },
      accessToken,
      refreshToken,
    },
    "Registered successfully",
  );
});

export const login = catchAsync(async (req, res) => {
  const { user, accessToken, refreshToken } = await authService.loginUser(
    req.body,
  );

  successResponse(
    res,
    200,
    {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        roles: user.roles,
        activeRole: user.activeRole,
      },
      accessToken,
      refreshToken,
    },
    "Logged in successfully",
  );
});

export const refresh = catchAsync(async (req, res) => {
  const accessToken = await authService.refreshAccessToken(
    req.body.refreshToken,
  );
  successResponse(res, 200, { accessToken }, "Token refreshed");
});

export const logout = catchAsync(async (req, res) => {
  await authService.logoutUser(req.userId);
  successResponse(res, 200, null, "Logged out successfully");
});

export const forgotPassword = catchAsync(async (req, res) => {
  await authService.forgotPassword(req.body.email);
  successResponse(
    res,
    200,
    null,
    "If this email is registered, a reset link has been sent",
  );
});

export const resetPassword = catchAsync(async (req, res) => {
  await authService.resetPassword(req.body.token, req.body.password);
  successResponse(res, 200, null, "Password has been reset successfully");
});
