import WalletTransaction from './walletTransaction.model.js';
import Withdrawal from '../withdrawals/withdrawal.model.js';

export async function getWalletSummary(userId, session = null) {
  let transactionsQuery = WalletTransaction.find({ userId }).lean();
  let withdrawalsQuery = Withdrawal.find({ freelancerId: userId, status: 'PENDING' }).lean();

  if (session) {
    transactionsQuery = transactionsQuery.session(session);
    withdrawalsQuery = withdrawalsQuery.session(session);
  }

  const [transactions, pendingWithdrawals] = await Promise.all([
    transactionsQuery,
    withdrawalsQuery,
  ]);

  const balance = transactions.reduce((total, item) => {
    return item.type === 'CREDIT' ? total + item.amount : total - item.amount;
  }, 0);

  const reserved = pendingWithdrawals.reduce((total, item) => total + item.amount, 0);

  return {
    balance: Number(balance.toFixed(2)),
    reserved: Number(reserved.toFixed(2)),
    available: Number(Math.max(0, balance - reserved).toFixed(2)),
  };
}

export async function getTransactions(userId) {
  return WalletTransaction.find({ userId }).sort({ createdAt: -1 }).lean();
}
