import crypto from 'node:crypto';
import mongoose from 'mongoose';
import Payment from './payment.model.js';
import Contract from '../contracts/contract.model.js';
import Project from '../projects/project.model.js';
import WalletTransaction from '../wallet/walletTransaction.model.js';
import { AppError } from '../../utils/errors.js';

function sha256(value) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

function money(value) {
  return Number(value || 0).toFixed(2);
}

function merchantConfig() {
  const merchantCode = process.env.FAWRY_MERCHANT_CODE;
  const secureKey = process.env.FAWRY_SECURE_KEY;
  const returnUrl = process.env.FAWRY_RETURN_URL || 'http://localhost:4200/wallet';
  const webhookUrl = process.env.FAWRY_WEBHOOK_URL || '';

  if (!merchantCode || !secureKey) {
    throw new AppError('Fawry credentials are missing in backend/.env', 500);
  }

  return { merchantCode, secureKey, returnUrl, webhookUrl };
}

function createReference() {
  return `${Date.now()}${Math.floor(Math.random() * 1000)}`;
}

function signCheckout({ merchantCode, merchantRefNum, customerProfileId, returnUrl, chargeItems, secureKey }) {
  const items = [...chargeItems].sort((a, b) => a.itemId.localeCompare(b.itemId));
  const itemString = items
    .map((item) => `${item.itemId}${item.quantity}${money(item.price)}`)
    .join('');

  return sha256(
    `${merchantCode}${merchantRefNum}${customerProfileId || ''}${returnUrl}${itemString}${secureKey}`,
  );
}

function verifyWebhookSignature(body, secureKey) {
  const value = [
    body.fawryRefNumber || '',
    body.merchantRefNumber || '',
    money(body.paymentAmount),
    money(body.orderAmount),
    body.orderStatus || '',
    body.paymentMethod || '',
    body.paymentRefrenceNumber || '',
    secureKey,
  ].join('');

  const expected = sha256(value);
  const received = String(body.messageSignature || '');
  if (expected.length !== received.length) return false;

  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(received));
}

function checkoutUpdate({ merchantRefNum, contract, amount }) {
  return {
    $set: {
      merchantRefNumber: merchantRefNum,
      fawryRefNumber: '',
      clientId: contract.clientId,
      freelancerId: contract.freelancerId,
      contractId: contract._id,
      amount,
      paymentMethod: '',
      status: 'INITIATED',
      providerStatus: 'NEW',
    },
    $push: { statusHistory: { status: 'INITIATED' } },
  };
}

export async function createCheckout(clientId, data) {
  const contract = await Contract.findById(data.contractId);
  if (!contract) throw new AppError('Contract not found', 404);
  if (String(contract.clientId) !== String(clientId)) {
    throw new AppError('Only the contract client can pay', 403);
  }
  if (contract.status !== 'AWAITING_PAYMENT') {
    throw new AppError('This contract is not waiting for payment', 400);
  }

  const alreadyPaid = await Payment.exists({
    contractId: contract._id,
    status: { $in: ['HELD', 'RELEASED'] },
  });
  if (alreadyPaid) throw new AppError('This contract is already paid', 400);

  const { merchantCode, secureKey, returnUrl, webhookUrl } = merchantConfig();
  const merchantRefNum = createReference();
  const amount = Number(contract.amount);
  const customerProfileId = String(clientId);
  const chargeItems = [{
    itemId: `contract-${contract._id}`,
    description: data.description || 'Freelance project payment',
    price: Number(amount.toFixed(2)),
    quantity: 1,
  }];

  let payment;
  const filter = {
    contractId: contract._id,
    status: { $nin: ['HELD', 'RELEASED'] },
  };
  const update = checkoutUpdate({ merchantRefNum, contract, amount });

  try {
    payment = await Payment.findOneAndUpdate(filter, update, {
      new: true,
      upsert: true,
      runValidators: true,
      setDefaultsOnInsert: true,
    });
  } catch (error) {
    // The unique contractId index protects against two checkout requests racing.
    if (error?.code !== 11000) throw error;

    const current = await Payment.findOne({ contractId: contract._id });
    if (current && ['HELD', 'RELEASED'].includes(current.status)) {
      throw new AppError('This contract is already paid', 400);
    }

    payment = await Payment.findOneAndUpdate(filter, update, {
      new: true,
      runValidators: true,
    });

    if (!payment) {
      throw new AppError('A payment checkout is already being processed. Please try again.', 409);
    }
  }

  const chargeRequest = {
    merchantCode,
    merchantRefNum,
    customerName: data.customerName,
    customerMobile: data.customerMobile,
    customerEmail: data.customerEmail,
    customerProfileId,
    paymentExpiry: String(Date.now() + 60 * 60 * 1000),
    chargeItems,
    returnUrl,
    authCaptureModePayment: false,
    ...(webhookUrl ? { orderWebHookUrl: webhookUrl } : {}),
    signature: signCheckout({
      merchantCode,
      merchantRefNum,
      customerProfileId,
      returnUrl,
      chargeItems,
      secureKey,
    }),
  };

  return { payment, chargeRequest };
}

export async function handleFawryWebhook(body) {
  const { secureKey } = merchantConfig();
  if (!verifyWebhookSignature(body, secureKey)) {
    throw new AppError('Invalid Fawry webhook signature', 400);
  }

  const payment = await Payment.findOne({
    merchantRefNumber: String(body.merchantRefNumber),
  });
  if (!payment) throw new AppError('Payment not found', 404);

  payment.fawryRefNumber = body.fawryRefNumber || payment.fawryRefNumber;
  payment.paymentMethod = body.paymentMethod || payment.paymentMethod;
  payment.providerStatus = body.orderStatus || payment.providerStatus;

  if (body.orderStatus === 'PAID') {
    if (!['HELD', 'RELEASED'].includes(payment.status)) {
      payment.status = 'HELD';
      payment.statusHistory.push({ status: 'PAID' }, { status: 'HELD' });
    }
  } else if (body.orderStatus === 'REFUNDED') {
    // Do not silently reverse a payment that has already been released to the wallet.
    // The provider status is still recorded and can be handled manually/admin-side later.
    if (!['REFUNDED', 'RELEASED'].includes(payment.status)) {
      payment.status = 'REFUNDED';
      payment.statusHistory.push({ status: 'REFUNDED' });
    }
  } else if (['FAILED', 'CANCELED', 'EXPIRED'].includes(body.orderStatus)) {
    if (!['FAILED', 'HELD', 'RELEASED', 'REFUNDED'].includes(payment.status)) {
      payment.status = 'FAILED';
      payment.statusHistory.push({ status: 'FAILED' });
    }
  }

  await payment.save();
  return payment;
}

export async function getPayment(id, userId) {
  const payment = await Payment.findById(id).lean();
  if (!payment) return null;
  if (
    String(payment.clientId) !== String(userId)
    && String(payment.freelancerId) !== String(userId)
  ) {
    throw new AppError('You cannot view this payment', 403);
  }
  return payment;
}

export async function getContractPayment(contractId, userId) {
  const payment = await Payment.findOne({ contractId }).lean();
  if (!payment) return null;
  if (
    String(payment.clientId) !== String(userId)
    && String(payment.freelancerId) !== String(userId)
  ) {
    throw new AppError('You cannot view this payment', 403);
  }
  return payment;
}

export async function releasePayment(id, clientId) {
  const session = await mongoose.startSession();
  let releasedPayment;

  try {
    await session.withTransaction(async () => {
      const payment = await Payment.findById(id).session(session);
      if (!payment) throw new AppError('Payment not found', 404);
      if (String(payment.clientId) !== String(clientId)) {
        throw new AppError('Only the client can release payment', 403);
      }

      // Safe retry: if a previous request already finished, return the same payment.
      if (payment.status === 'RELEASED') {
        releasedPayment = payment;
        return;
      }
      if (payment.status !== 'HELD') {
        throw new AppError('Only held payments can be released', 400);
      }

      const contract = await Contract.findById(payment.contractId).session(session);
      if (!contract) throw new AppError('Contract not found', 404);
      if (contract.status !== 'SUBMITTED') {
        throw new AppError('Work must be submitted before payment can be released', 400);
      }

      const existingCredit = await WalletTransaction.findOne({
        paymentId: payment._id,
        reason: 'PAYMENT_RELEASE',
      }).session(session);

      if (!existingCredit) {
        await WalletTransaction.create([{
          userId: payment.freelancerId,
          type: 'CREDIT',
          amount: contract.freelancerAmount,
          reason: 'PAYMENT_RELEASE',
          paymentId: payment._id,
          contractId: payment.contractId,
        }], { session });
      }

      payment.status = 'RELEASED';
      payment.statusHistory.push({ status: 'RELEASED' });
      await payment.save({ session });

      contract.status = 'COMPLETED';
      await contract.save({ session });
      await Project.findByIdAndUpdate(
        contract.projectId,
        { status: 'COMPLETED' },
        { session },
      );

      releasedPayment = payment;
    });

    return releasedPayment;
  } catch (error) {
    // A concurrent retry can hit the unique wallet-credit index. If the first request
    // completed successfully, returning the released payment keeps this endpoint idempotent.
    if (error?.code === 11000) {
      const current = await Payment.findById(id);
      if (current?.status === 'RELEASED') return current;
    }
    throw error;
  } finally {
    await session.endSession();
  }
}
