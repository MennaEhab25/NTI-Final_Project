import Payment from './payment.model.js';
import Contract from '../contracts/contract.model.js';
import Project from '../projects/project.model.js';
import Delivery from '../deliveries/delivery.model.js';
import WalletTransaction from '../wallet/walletTransaction.model.js';
import PlatformRevenueTransaction from '../platformRevenue/platformRevenueTransaction.model.js';
import { AppError } from '../../utils/errors.js';

export async function releasePaymentInSession(paymentId, clientId, session) {
  const payment = await Payment.findById(paymentId).session(session);
  if (!payment) throw new AppError('Payment not found', 404);
  if (String(payment.clientId) !== String(clientId)) {
    throw new AppError('Only the client can release payment', 403);
  }
  if (payment.status === 'RELEASED') return payment;
  if (payment.status !== 'HELD') {
    throw new AppError('Only held payments can be released', 400);
  }

  const contract = await Contract.findById(payment.contractId).session(session);
  if (!contract) throw new AppError('Contract not found', 404);
  if (contract.status !== 'SUBMITTED') {
    throw new AppError('Work must be submitted before payment can be released', 400);
  }

  const latestDelivery = await Delivery.findOne({ contractId: contract._id })
    .sort({ version: -1 })
    .session(session);
  if (!latestDelivery || latestDelivery.status !== 'APPROVED') {
    throw new AppError('The latest delivery must be approved before payment can be released', 400);
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

  const existingRevenue = await PlatformRevenueTransaction.findOne({ paymentId: payment._id }).session(session);
  if (!existingRevenue) {
    await PlatformRevenueTransaction.create([{
      type: 'COMMISSION',
      amount: contract.commissionAmount,
      currency: payment.currency || 'EGP',
      commissionRate: contract.commissionRate,
      grossAmount: contract.amount,
      freelancerAmount: contract.freelancerAmount,
      paymentId: payment._id,
      contractId: contract._id,
      clientId: payment.clientId,
      freelancerId: payment.freelancerId,
      recognizedAt: new Date(),
    }], { session });
  }

  payment.status = 'RELEASED';
  payment.statusHistory.push({ status: 'RELEASED' });
  await payment.save({ session });

  contract.status = 'COMPLETED';
  await contract.save({ session });
  await Project.findByIdAndUpdate(contract.projectId, { status: 'COMPLETED' }, { session });
  return payment;
}

export async function releaseContractPaymentInSession(contractId, clientId, session) {
  const payment = await Payment.findOne({ contractId }).session(session);
  if (!payment) throw new AppError('Payment not found for this contract', 404);
  return releasePaymentInSession(payment._id, clientId, session);
}
