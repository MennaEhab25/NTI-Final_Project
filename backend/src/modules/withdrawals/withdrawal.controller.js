import { createWithdrawal, listWithdrawals } from './withdrawal.service.js';
import { catchAsync } from '../../utils/catchAsync.js';
import { successResponse } from '../../utils/apiResponse.js';
import { AppError } from '../../utils/errors.js';

export const requestWithdrawal = catchAsync(async (req, res) => {
  const { amount, method, accountDetails } = req.body;
  let data;
  try {
    data = await createWithdrawal({ freelancerId: req.userId, amount, method, accountDetails });
  } catch (error) {
    if (error?.code === 11000) throw new AppError('You already have a pending withdrawal request', 400);
    throw error;
  }
  successResponse(res, 201, data);
});

export const myWithdrawals = catchAsync(async (req, res) => {
  successResponse(res, 200, await listWithdrawals(req.userId));
});
