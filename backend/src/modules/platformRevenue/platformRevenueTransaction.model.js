import mongoose from 'mongoose';

const platformRevenueTransactionSchema = new mongoose.Schema({
  type: { type: String, enum: ['COMMISSION'], default: 'COMMISSION', required: true },
  amount: { type: Number, required: true, min: 0 },
  currency: { type: String, default: 'EGP', required: true },
  commissionRate: { type: Number, required: true, min: 0 },
  grossAmount: { type: Number, required: true, min: 0 },
  freelancerAmount: { type: Number, required: true, min: 0 },
  paymentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Payment', required: true, unique: true, index: true },
  contractId: { type: mongoose.Schema.Types.ObjectId, ref: 'Contract', required: true, index: true },
  clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  freelancerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  recognizedAt: { type: Date, default: Date.now, required: true },
}, { timestamps: true });

platformRevenueTransactionSchema.index({ contractId: 1, type: 1 }, { unique: true });

export default mongoose.models.PlatformRevenueTransaction
  || mongoose.model('PlatformRevenueTransaction', platformRevenueTransactionSchema);
