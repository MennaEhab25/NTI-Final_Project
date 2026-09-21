import mongoose from 'mongoose';

const statusHistorySchema = new mongoose.Schema({
  status: { type: String, required: true },
  at: { type: Date, default: Date.now },
}, { _id: false });

const paymentSchema = new mongoose.Schema({
  merchantRefNumber: { type: String, required: true, unique: true, index: true },
  fawryRefNumber: { type: String, default: '' },
  clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  freelancerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  contractId: { type: mongoose.Schema.Types.ObjectId, ref: 'Contract', required: true },
  amount: { type: Number, required: true, min: 1 },
  currency: { type: String, default: 'EGP' },
  paymentMethod: { type: String, default: '' },
  status: {
    type: String,
    enum: ['INITIATED', 'PAID', 'HELD', 'RELEASED', 'REFUNDED', 'FAILED'],
    default: 'INITIATED',
  },
  providerStatus: { type: String, default: 'NEW' },
  statusHistory: { type: [statusHistorySchema], default: [] },
}, { timestamps: true });

paymentSchema.index({ contractId: 1 }, { unique: true });

export default mongoose.models.Payment || mongoose.model('Payment', paymentSchema);
