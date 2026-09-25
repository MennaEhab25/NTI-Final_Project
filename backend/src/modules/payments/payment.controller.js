import { createCheckout, getContractPayment, getPayment, handlePaymobWebhook, releasePayment } from './payment.service.js';
import { catchAsync } from '../../utils/catchAsync.js';
import { successResponse } from '../../utils/apiResponse.js';
import { AppError } from '../../utils/errors.js';
import { notify } from '../notifications/notification.service.js';
import { logEvent } from '../audit/audit.service.js';

export const checkout = catchAsync(async (req, res) => {
  const data = await createCheckout(req.userId, req.body);
  successResponse(res, 201, data);
});

export const webhook = catchAsync(async (req, res) => {
  await handlePaymobWebhook(req.body, req.query.hmac);
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
  const payment = await releasePayment(req.params.id, req.userId);
  await logEvent({ contractId: payment.contractId, type: 'payment_released', actorId: req.userId, meta: { paymentId: payment._id } });
  await notify({
    userId: payment.freelancerId,
    type: 'payment_released',
    message: 'Payment was released to your platform wallet.',
    data: { contractId: payment.contractId, paymentId: payment._id, link: '/wallet' },
  });
  successResponse(res, 200, payment);
});
