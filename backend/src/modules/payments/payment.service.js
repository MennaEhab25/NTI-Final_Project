import crypto from 'node:crypto';
import mongoose from 'mongoose';
import Payment from './payment.model.js';
import Contract from '../contracts/contract.model.js';
import Project from '../projects/project.model.js';
import WalletTransaction from '../wallet/walletTransaction.model.js';
import Delivery from '../deliveries/delivery.model.js';
import { AppError } from '../../utils/errors.js';

function paymobConfig() {
  const baseUrl = (process.env.PAYMOB_BASE_URL || 'https://accept.paymob.com').replace(/\/$/, '');
  const secretKey = process.env.PAYMOB_SECRET_KEY;
  const publicKey = process.env.PAYMOB_PUBLIC_KEY;
  const hmacSecret = process.env.PAYMOB_HMAC_SECRET;
  const cardIntegrationId = Number(process.env.PAYMOB_CARD_INTEGRATION_ID);
  const returnUrl = process.env.PAYMOB_RETURN_URL || 'http://localhost:4200/wallet';
  const webhookUrl = process.env.PAYMOB_WEBHOOK_URL || '';

  if (!secretKey || !publicKey || !hmacSecret || !Number.isInteger(cardIntegrationId) || !webhookUrl) {
    throw new AppError(
      'Paymob settings are missing in backend/.env (SECRET_KEY, PUBLIC_KEY, HMAC_SECRET, CARD_INTEGRATION_ID, WEBHOOK_URL)',
      500,
    );
  }

  return { baseUrl, secretKey, publicKey, hmacSecret, cardIntegrationId, returnUrl, webhookUrl };
}

function createReference(contractId) {
  return `contract-${contractId}-${Date.now()}`;
}

function splitName(name) {
  const parts = String(name || '').trim().split(/\s+/).filter(Boolean);
  return {
    firstName: parts[0] || 'Customer',
    lastName: parts.slice(1).join(' ') || 'Customer',
  };
}

function toCents(amount) {
  return Math.round(Number(amount) * 100);
}

function timingSafeEqualHex(expected, received) {
  if (!expected || !received || expected.length !== received.length) return false;
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(received));
}

function verifyPaymobTransactionHmac(obj, receivedHmac, hmacSecret) {
  if (!obj || !obj.order || !obj.source_data) return false;

  const fields = [
    obj.amount_cents,
    obj.created_at,
    obj.currency,
    obj.error_occured,
    obj.has_parent_transaction,
    obj.id,
    obj.integration_id,
    obj.is_3d_secure,
    obj.is_auth,
    obj.is_capture,
    obj.is_refunded,
    obj.is_standalone_payment,
    obj.is_voided,
    obj.order.id,
    obj.owner,
    obj.pending,
    obj.source_data.pan,
    obj.source_data.sub_type,
    obj.source_data.type,
    obj.success,
  ];

  const computed = crypto
    .createHmac('sha512', hmacSecret)
    .update(fields.map((value) => String(value ?? '')).join(''))
    .digest('hex');

  return timingSafeEqualHex(computed, String(receivedHmac || ''));
}

async function callPaymobIntention(payload, config) {
  let response;
  try {
    response = await fetch(`${config.baseUrl}/v1/intention/`, {
      method: 'POST',
      headers: {
        Authorization: `Token ${config.secretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
  } catch {
    throw new AppError('Could not connect to Paymob. Please try again.', 502);
  }

  const text = await response.text();
  let data = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { detail: text };
  }

  if (!response.ok) {
    const message = data?.detail || data?.message || data?.error || 'Paymob rejected the payment intention';
    throw new AppError(`Paymob: ${typeof message === 'string' ? message : JSON.stringify(message)}`, 502);
  }

  if (!data.client_secret || !data.id || !data.intention_order_id) {
    throw new AppError('Paymob returned an incomplete payment intention', 502);
  }

  return data;
}

function checkoutUpdate({ reference, contract, amount, intention }) {
  return {
    $set: {
      merchantRefNumber: reference,
      provider: 'PAYMOB',
      paymobIntentionId: String(intention.id),
      paymobOrderId: String(intention.intention_order_id),
      paymobTransactionId: '',
      clientId: contract.clientId,
      freelancerId: contract.freelancerId,
      contractId: contract._id,
      amount,
      paymentMethod: '',
      status: 'INITIATED',
      providerStatus: intention.status || 'intended',
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

  const config = paymobConfig();
  const amount = Number(contract.amount);
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new AppError('Contract amount is invalid', 400);
  }

  const amountCents = toCents(amount);
  const reference = createReference(contract._id);
  const { firstName, lastName } = splitName(data.customerName);

  const intentionPayload = {
    amount: amountCents,
    currency: 'EGP',
    payment_methods: [config.cardIntegrationId],
    items: [{
      name: `Contract ${contract._id}`,
      amount: amountCents,
      description: data.description || 'Freelance contract payment',
      quantity: 1,
    }],
    billing_data: {
      apartment: 'NA',
      first_name: firstName,
      last_name: lastName,
      street: 'NA',
      building: 'NA',
      phone_number: data.customerMobile,
      city: 'Cairo',
      country: 'EG',
      email: data.customerEmail,
      floor: 'NA',
      state: 'Cairo',
      postal_code: 'NA',
    },
    customer: {
      first_name: firstName,
      last_name: lastName,
      email: data.customerEmail,
    },
    extras: { contractId: String(contract._id) },
    special_reference: reference,
    expiration: 3600,
    redirection_url: config.returnUrl,
    notification_url: config.webhookUrl,
  };

  const intention = await callPaymobIntention(intentionPayload, config);

  let payment;
  const filter = {
    contractId: contract._id,
    status: { $nin: ['HELD', 'RELEASED'] },
  };
  const update = checkoutUpdate({ reference, contract, amount, intention });

  try {
    payment = await Payment.findOneAndUpdate(filter, update, {
      new: true,
      upsert: true,
      runValidators: true,
      setDefaultsOnInsert: true,
    });
  } catch (error) {
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

  const checkoutUrl =
    `${config.baseUrl}/unifiedcheckout/`
    + `?publicKey=${encodeURIComponent(config.publicKey)}`
    + `&clientSecret=${encodeURIComponent(intention.client_secret)}`;

  return {
    payment,
    checkoutUrl,
    intentionId: intention.id,
    paymobOrderId: intention.intention_order_id,
  };
}

export async function handlePaymobWebhook(body, receivedHmac) {
  const config = paymobConfig();
  const obj = body?.obj;

  if (!obj || !verifyPaymobTransactionHmac(obj, receivedHmac, config.hmacSecret)) {
    throw new AppError('Invalid Paymob webhook HMAC', 401);
  }

  const orderId = String(obj.order?.id || '');
  const merchantReference = String(obj.order?.merchant_order_id || '');
  const lookup = [];
  if (orderId) lookup.push({ paymobOrderId: orderId });
  if (merchantReference) lookup.push({ merchantRefNumber: merchantReference });
  if (!lookup.length) throw new AppError('Paymob callback has no usable order reference', 400);

  const payment = await Payment.findOne({ $or: lookup });
  if (!payment) throw new AppError('Payment not found for Paymob callback', 404);

  const expectedAmountCents = toCents(payment.amount);
  if (Number(obj.amount_cents) !== expectedAmountCents || String(obj.currency) !== payment.currency) {
    throw new AppError('Paymob callback amount or currency does not match the payment', 400);
  }

  if (Number(obj.integration_id) !== config.cardIntegrationId) {
    throw new AppError('Paymob callback integration does not match this project configuration', 400);
  }

  payment.provider = 'PAYMOB';
  payment.paymobTransactionId = String(obj.id || payment.paymobTransactionId || '');
  payment.paymobOrderId = orderId || payment.paymobOrderId;
  payment.paymentMethod =
    [obj.source_data?.type, obj.source_data?.sub_type].filter(Boolean).join(' / ')
    || payment.paymentMethod;

  if (obj.is_refunded === true) {
    payment.providerStatus = 'REFUNDED';
    if (!['REFUNDED', 'RELEASED'].includes(payment.status)) {
      payment.status = 'REFUNDED';
      payment.statusHistory.push({ status: 'REFUNDED' });
    }
  } else if (obj.is_voided === true) {
    payment.providerStatus = 'VOIDED';
    if (!['FAILED', 'HELD', 'RELEASED', 'REFUNDED'].includes(payment.status)) {
      payment.status = 'FAILED';
      payment.statusHistory.push({ status: 'FAILED' });
    }
  } else if (obj.success === true && obj.pending === false) {
    payment.providerStatus = 'SUCCESS';
    if (!['HELD', 'RELEASED'].includes(payment.status)) {
      payment.status = 'HELD';
      payment.statusHistory.push({ status: 'PAID' }, { status: 'HELD' });
    }
  } else if (obj.pending === true) {
    payment.providerStatus = 'PENDING';
  } else {
    payment.providerStatus = 'FAILED';
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

      const approvedDelivery = await Delivery.findOne({
        contractId: contract._id,
        status: 'APPROVED',
      }).sort({ version: -1 }).session(session);

      if (!approvedDelivery) {
        throw new AppError('The client must approve the latest delivery before releasing payment', 400);
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
      await Project.findByIdAndUpdate(contract.projectId, { status: 'COMPLETED' }, { session });
      releasedPayment = payment;
    });

    return releasedPayment;
  } catch (error) {
    if (error?.code === 11000) {
      const current = await Payment.findById(id);
      if (current?.status === 'RELEASED') return current;
    }
    throw error;
  } finally {
    await session.endSession();
  }
}
