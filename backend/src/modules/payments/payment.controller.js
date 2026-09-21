import { createCheckout, getContractPayment, getPayment, handleFawryWebhook, releasePayment } from './payment.service.js';
import { catchAsync } from '../../utils/catchAsync.js';
import { successResponse } from '../../utils/apiResponse.js';
import { AppError } from '../../utils/errors.js';

export const checkout = catchAsync(async (req, res) => {
  const data = await createCheckout(req.userId, req.body);
  successResponse(res, 201, data);
});

export const webhook = catchAsync(async (req, res) => {
  await handleFawryWebhook(req.body);
  res.json({ received: true });
});

export const findPayment = catchAsync(async (req, res) => {
  const data = await getPayment(req.params.id, req.userId);
  if (!data) throw new AppError('Payment not found', 404);
  successResponse(res, 200, data);
});

export const byContract = catchAsync(async (req, res) => {
  successResponse(res, 200, await getContractPayment(req.params.contractId, req.userId));
});

export const release = catchAsync(async (req, res) => {
  successResponse(res, 200, await releasePayment(req.params.id, req.userId));
});
