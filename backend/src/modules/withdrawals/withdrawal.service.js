import mongoose from 'mongoose';
import Withdrawal from './withdrawal.model.js';
import WalletTransaction from '../wallet/walletTransaction.model.js';
import { getWalletSummary } from '../wallet/wallet.service.js';
import { AppError } from '../../utils/errors.js';

async function reserveWithdrawalSlot({ freelancerId, amount, method, accountDetails }) {
  const wallet = await getWalletSummary(freelancerId);

  const settledBalance = wallet.balance - wallet.reserved;
  if (amount > settledBalance) {
    throw new AppError('Insufficient available balance', 400);
  }

  let created;
  try {
    created = await Withdrawal.create({ freelancerId, amount, method, accountDetails });
  } catch (error) {
    if (error?.code !== 11000) throw error;
    created = null;
  }

  if (created) return created;

  const confirmed = await getWalletSummary(freelancerId);
  const pending = await Withdrawal.findOne({ freelancerId, status: 'PENDING' }).lean();
  if (!pending || amount <= pending.amount) {
    throw new AppError('You already have a pending withdrawal request', 400);
  }
  if (amount > confirmed.balance - confirmed.reserved) {
    throw new AppError('Insufficient available balance', 400);
  }

  return Withdrawal.findOneAndUpdate(
    { freelancerId, status: 'PENDING', amount: pending.amount },
    [
      {
        $set: {
          amount: {
            $cond: [
              { $lte: [{ $add: ['$amount', amount - confirmed.reserved] }, confirmed.balance] },
              amount,
              '$amount',
            ],
          },
        },
      },
    ],
    { new: true, updatePipeline: true },
  );
}

export async function createWithdrawal(data) {
  const reservation = await reserveWithdrawalSlot({
    freelancerId: data.freelancerId,
    amount: data.amount,
    method: data.method,
    accountDetails: data.accountDetails,
  });

  if (reservation) return reservation;

  const pending = await Withdrawal.findOne({ freelancerId: data.freelancerId, status: 'PENDING' }).lean();
  if (pending) {
    throw new AppError('You already have a pending withdrawal request', 400);
  }
  throw new AppError('Insufficient available balance', 400);
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
