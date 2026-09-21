import { approveExtension, createExtension, rejectExtension } from './extension.service.js';
import { catchAsync } from '../../utils/catchAsync.js';
import { successResponse } from '../../utils/apiResponse.js';
import { AppError } from '../../utils/errors.js';

export const createForContract = catchAsync(async (req, res) => {
  let data;
  try {
    data = await createExtension(req.params.id, req.userId, req.body);
  } catch (error) {
    if (error?.code === 11000) throw new AppError('There is already a pending extension request for this contract', 400);
    throw error;
  }
  successResponse(res, 201, data, 'Extension request created');
});

export const approve = catchAsync(async (req, res) => {
  successResponse(res, 200, await approveExtension(req.params.id, req.userId));
});

export const reject = catchAsync(async (req, res) => {
  successResponse(res, 200, await rejectExtension(req.params.id, req.userId));
});
