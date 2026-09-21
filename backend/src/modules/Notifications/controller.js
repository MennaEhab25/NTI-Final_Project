import * as service from './notification.service.js';
import { catchAsync } from '../../utils/catchAsync.js';
import { successResponse } from '../../utils/apiResponse.js';

export const list = catchAsync(async (req, res) => {
  successResponse(res, 200, await service.listForUser(req.userId));
});

export const markRead = catchAsync(async (req, res) => {
  successResponse(res, 200, await service.markRead(req.params.id, req.userId));
});

export const markAllRead = catchAsync(async (req, res) => {
  await service.markAllRead(req.userId);
  successResponse(res, 200, { updated: true });
});

