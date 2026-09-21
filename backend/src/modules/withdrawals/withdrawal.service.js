import mongoose from 'mongoose';
import Withdrawal from './withdrawal.model.js';
import WalletTransaction from '../wallet/walletTransaction.model.js';
import { getWalletSummary } from '../wallet/wallet.service.js';
import { AppError } from '../../utils/errors.js';

export async function createWithdrawal(data) {
  const wallet = await getWalletSummary(data.freelancerId);

  if (data.amount > wallet.available) {
    throw new AppError('Insufficient available balance', 400);
  }

  return Withdrawal.create({
    freelancerId: data.freelancerId,
    amount: data.amount,
    method: data.method,
    accountDetails: data.accountDetails,
  });
}

export async function listWithdrawals(freelancerId) {
  return Withdrawal.find({ freelancerId }).sort({ createdAt: -1 }).lean();
}

export async function approveWithdrawal(id) {
  const session = await mongoose.startSession();
  let approvedWithdrawal;

  try {
    await session.withTransaction(async () => {
      const withdrawal = await Withdrawal.findById(id).session(session);
      if (!withdrawal) throw new AppError('Withdrawal request not found', 404);

      // Safe retry from the admin UI.
      if (withdrawal.status === 'APPROVED') {
        approvedWithdrawal = withdrawal;
        return;
      }
      if (withdrawal.status !== 'PENDING') {
        throw new AppError('Withdrawal request is already processed', 400);
      }

      const existingDebit = await WalletTransaction.findOne({
        withdrawalId: withdrawal._id,
      }).session(session);

      if (!existingDebit) {
        const wallet = await getWalletSummary(withdrawal.freelancerId, session);
        if (withdrawal.amount > wallet.balance) {
          throw new AppError('Wallet balance is not enough', 400);
        }

        await WalletTransaction.create([{
          userId: withdrawal.freelancerId,
          type: 'DEBIT',
          amount: withdrawal.amount,
          reason: 'WITHDRAWAL',
          withdrawalId: withdrawal._id,
        }], { session });
      }

      withdrawal.status = 'APPROVED';
      withdrawal.processedAt = new Date();
      await withdrawal.save({ session });
      approvedWithdrawal = withdrawal;
    });

    return approvedWithdrawal;
  } catch (error) {
    if (error?.code === 11000) {
      const current = await Withdrawal.findById(id);
      if (current?.status === 'APPROVED') return current;
    }
    throw error;
  } finally {
    await session.endSession();
  }
}

export async function rejectWithdrawal(id) {
  const withdrawal = await Withdrawal.findById(id);
  if (!withdrawal) throw new AppError('Withdrawal request not found', 404);
  if (withdrawal.status !== 'PENDING') {
    throw new AppError('Withdrawal request is already processed', 400);
  }

  withdrawal.status = 'REJECTED';
  withdrawal.processedAt = new Date();
  await withdrawal.save();
  return withdrawal;
}
