import * as service from './user.service.js';
import { catchAsync } from '../../utils/catchAsync.js';
import { successResponse } from '../../utils/apiResponse.js';
import { AppError } from '../../utils/errors.js';

export const me = catchAsync(async (req, res) => {
  successResponse(res, 200, await service.getMe(req.userId));
});

export const updateMe = catchAsync(async (req, res) => {
  successResponse(res, 200, await service.updateMe(req.userId, req.body), 'Profile updated');
});

export const publicProfile = catchAsync(async (req, res) => {
  const user = await service.getPublicUser(req.params.id);
  if (!user) throw new AppError('User not found', 404);
  successResponse(res, 200, user);
});

export const freelancers = catchAsync(async (req, res) => {
  successResponse(res, 200, await service.listFreelancers(req.query));
});
