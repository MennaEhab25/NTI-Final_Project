import mongoose from 'mongoose';

const withdrawalSchema = new mongoose.Schema({
  freelancerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  amount: { type: Number, required: true, min: 1 },
  method: { type: String, enum: ['MOBILE_WALLET', 'BANK'], required: true },
  accountDetails: { type: String, required: true, trim: true },
  status: { type: String, enum: ['PENDING', 'APPROVED', 'REJECTED'], default: 'PENDING', index: true },
  processedAt: { type: Date, default: null },
}, { timestamps: true });
withdrawalSchema.index(
  { freelancerId: 1 },
  { unique: true, partialFilterExpression: { status: 'PENDING' } },
);

export default mongoose.models.Withdrawal || mongoose.model('Withdrawal', withdrawalSchema);
