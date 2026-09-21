import mongoose from 'mongoose';

const walletTransactionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  type: { type: String, enum: ['CREDIT', 'DEBIT'], required: true },
  amount: { type: Number, required: true, min: 0.01 },
  reason: { type: String, required: true },
  paymentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Payment' },
  contractId: { type: mongoose.Schema.Types.ObjectId, ref: 'Contract' },
  withdrawalId: { type: mongoose.Schema.Types.ObjectId, ref: 'Withdrawal' },
}, { timestamps: true });

walletTransactionSchema.index({ paymentId: 1, reason: 1 }, { unique: true, sparse: true });
walletTransactionSchema.index({ withdrawalId: 1 }, { unique: true, sparse: true });
export default mongoose.models.WalletTransaction || mongoose.model('WalletTransaction', walletTransactionSchema);
