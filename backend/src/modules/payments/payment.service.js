import crypto from 'node:crypto';
import mongoose from 'mongoose';
import Payment from './payment.model.js';
import Contract from '../contracts/contract.model.js';
import Project from '../projects/project.model.js';
import User from '../users/user.model.js';
import { AppError } from '../../utils/errors.js';
import env from '../../config/env.config.js';
import { releasePaymentInSession } from './payment-settlement.service.js';

function paymobConfig() {
  const missing = [];
  if (!env.PAYMOB_SECRET_KEY) missing.push('PAYMOB_SECRET_KEY');
  if (!env.PAYMOB_PUBLIC_KEY) missing.push('PAYMOB_PUBLIC_KEY');
  if (!env.PAYMOB_HMAC_SECRET) missing.push('PAYMOB_HMAC_SECRET');
  if (!Number.isInteger(env.PAYMOB_CARD_INTEGRATION_ID)) missing.push('PAYMOB_CARD_INTEGRATION_ID');
  if (!env.PAYMOB_WEBHOOK_URL) missing.push('PAYMOB_WEBHOOK_URL');

  if (missing.length) {
    throw new AppError(`Paymob payments are not configured. Set ${missing.join(', ')} in backend/.env.`, 503);
  }

  return {
    baseUrl: env.PAYMOB_BASE_URL,
    secretKey: env.PAYMOB_SECRET_KEY,
    publicKey: env.PAYMOB_PUBLIC_KEY,
    hmacSecret: env.PAYMOB_HMAC_SECRET,
    cardIntegrationId: env.PAYMOB_CARD_INTEGRATION_ID,
    returnUrl: env.PAYMOB_RETURN_URL,
    webhookUrl: env.PAYMOB_WEBHOOK_URL,
  };
}

const CHECKOUT_RESERVATION_TTL_MS = 15 * 60 * 1000;

function abandonedReservationCutoff() {
  return new Date(Date.now() - CHECKOUT_RESERVATION_TTL_MS);
}

function createReference(contractId) {
  return `contract-${contractId}-${Date.now()}`;
}

async function reserveCheckoutIntention(contract, clientId) {
  const staleBefore = abandonedReservationCutoff();
  const reservationFields = {
    clientId,
    freelancerId: contract.freelancerId,
    amount: Number(contract.amount),
    currency: 'EGP',
    provider: 'PAYMOB',
    paymentMethod: '',
    status: 'INITIATED',
    providerStatus: 'RESERVING',
    checkoutReservationMarker: true,
    paymobIntentionId: '',
    paymobOrderId: '',
    paymobTransactionId: '',
  };

  try {
    return await Payment.create({
      ...reservationFields,
      contractId: contract._id,
      merchantRefNumber: createReference(contract._id),
    });
  } catch (error) {
    if (error?.code !== 11000) throw error;
  }

  const unpublished = { $in: ['', null] };
  return Payment.findOneAndUpdate(
    {
      contractId: contract._id,
      status: { $nin: ['HELD', 'RELEASED'] },
      $or: [
        { providerStatus: 'NEW', paymobIntentionId: unpublished },
        {
          updatedAt: { $lte: staleBefore },
          paymobIntentionId: unpublished,
        },
      ],
    },
    { $set: reservationFields },
    { new: true },
  );
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
  let data;
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
      checkoutReservationMarker: false,
      ...(reference ? { merchantRefNumber: reference } : {}),
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
  if (contract.status !== 'AWAITING_PAYMENT'
    || !contract.clientApproval?.approved
    || !contract.freelancerApproval?.approved) {
    throw new AppError('This contract is not ready for funding', 400);
  }

  const existingPaidPayment = await Payment.findOne({
    contractId: contract._id,
    status: { $in: ['HELD', 'RELEASED'] },
  }).lean();
  if (existingPaidPayment) throw new AppError('This contract is already paid', 400);

  const payer = await User.findById(clientId).select('name email').lean();
  if (!payer) throw new AppError('Client account not found', 404);

  const config = paymobConfig();
  const amount = Number(contract.amount);
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new AppError('Contract amount is invalid', 400);
  }

  const reservation = await reserveCheckoutIntention(contract, clientId);
  if (!reservation) {
    const existing = await Payment.findOne({ contractId: contract._id }).lean();
    if (existing && ['HELD', 'RELEASED'].includes(existing.status)) {
      throw new AppError('This contract is already paid', 400);
    }
    throw new AppError('A checkout is already in progress for this contract. Please try again.', 409);
  }

  const amountCents = toCents(amount);
  const reference = createReference(contract._id);
  const { firstName, lastName } = splitName(payer.name);
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
      email: payer.email,
      floor: 'NA',
      state: 'Cairo',
      postal_code: 'NA',
    },
    customer: { first_name: firstName, last_name: lastName, email: payer.email },
    extras: { contractId: String(contract._id) },
    special_reference: reference,
    expiration: 3600,
    redirection_url: config.returnUrl,
    notification_url: config.webhookUrl,
  };

  let intention;
  try {
    intention = await callPaymobIntention(intentionPayload, config);
  } catch (error) {
    await Payment.findOneAndUpdate(
      {
        _id: reservation._id,
        status: 'INITIATED',
        providerStatus: 'RESERVING',
        checkoutReservationMarker: true,
        paymobIntentionId: { $in: ['', null] },
      },
      {
        $set: {
          providerStatus: 'NEW',
          checkoutReservationMarker: false,
        },
      },
      { new: true },
    );

    throw error;
  }

  const payment = await Payment.findOneAndUpdate(
    {
      _id: reservation._id,
      status: 'INITIATED',
      checkoutReservationMarker: true,
      providerStatus: 'RESERVING',
      paymobIntentionId: { $in: ['', null] },
    },
    checkoutUpdate({ reference: reservation.merchantRefNumber, contract, amount, intention }),
    { new: true, runValidators: true },
  );

  if (!payment) {
    const current = await Payment.findOne({ contractId: contract._id }).lean();
    if (current && ['HELD', 'RELEASED'].includes(current.status)) {
      throw new AppError('This contract is already paid', 400);
    }
    throw new AppError('A checkout is already in progress for this contract. Please try again.', 409);
  }

  const checkoutUrl = `${config.baseUrl}/unifiedcheckout/`
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
  if (!orderId && !merchantReference) {
    throw new AppError('Paymob callback has no usable order reference', 400);
  }

  let payment = orderId ? await Payment.findOne({ paymobOrderId: orderId }) : null;
  if (!payment && merchantReference) {
    payment = await Payment.findOne({ merchantRefNumber: merchantReference });
  }
  if (!payment) throw new AppError('Payment not found for Paymob callback', 404);

  if (Number(obj.amount_cents) !== toCents(payment.amount) || String(obj.currency) !== payment.currency) {
    throw new AppError('Paymob callback amount or currency does not match the payment', 400);
  }
  if (Number(obj.integration_id) !== config.cardIntegrationId) {
    throw new AppError('Paymob callback integration does not match this project configuration', 400);
  }

  payment.provider = 'PAYMOB';
  payment.paymobTransactionId = String(obj.id || payment.paymobTransactionId || '');
  payment.paymobOrderId = orderId || payment.paymobOrderId;
  payment.paymentMethod = [obj.source_data?.type, obj.source_data?.sub_type].filter(Boolean).join(' / ')
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

  if (payment.status === 'HELD') {
    const session = await mongoose.startSession();
    try {
      await session.withTransaction(async () => {
        const contract = await Contract.findById(payment.contractId).session(session);
        if (!contract) throw new AppError('Contract not found', 404);

        if (contract.status === 'AWAITING_PAYMENT') {
          if (!contract.clientApproval?.approved || !contract.freelancerApproval?.approved) {
            throw new AppError('Contract approvals are incomplete', 400);
          }

          const project = await Project.findById(contract.projectId).session(session);
          if (!project) throw new AppError('Project not found', 404);

          const startDate = new Date();
          contract.status = 'ACTIVE';
          contract.startDate = startDate;
          contract.deadline = new Date(startDate.getTime() + contract.durationDays * 24 * 60 * 60 * 1000);
          project.status = 'IN_PROGRESS';

          await contract.save({ session });
          await project.save({ session });
        }
      });
    } finally {
      await session.endSession();
    }
  }

  return payment;
}

export async function getPayment(id, userId) {
  const payment = await Payment.findById(id).lean();
  if (!payment) return null;
  if (String(payment.clientId) !== String(userId) && String(payment.freelancerId) !== String(userId)) {
    throw new AppError('You cannot view this payment', 403);
  }
  return payment;
}

export async function getContractPayment(contractId, userId) {
  const payment = await Payment.findOne({ contractId }).lean();
  if (!payment) return null;
  if (String(payment.clientId) !== String(userId) && String(payment.freelancerId) !== String(userId)) {
    throw new AppError('You cannot view this payment', 403);
  }
  return payment;
}

export async function getMyPayments(userId) {
  return Payment.find({ clientId: userId }).sort({ createdAt: -1 }).lean();
}

export async function releasePayment(id, clientId) {
  const session = await mongoose.startSession();
  let releasedPayment;
  try {
    await session.withTransaction(async () => {
      releasedPayment = await releasePaymentInSession(id, clientId, session);
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
