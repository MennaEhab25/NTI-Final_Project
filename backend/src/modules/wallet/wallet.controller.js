import { getTransactions, getWalletSummary } from './wallet.service.js';
import { catchAsync } from '../../utils/catchAsync.js';
import { successResponse } from '../../utils/apiResponse.js';

export const walletSummary = catchAsync(async (req, res) => {
  successResponse(res, 200, await getWalletSummary(req.userId));
});

export const walletTransactions = catchAsync(async (req, res) => {
  successResponse(res, 200, await getTransactions(req.userId));
});
