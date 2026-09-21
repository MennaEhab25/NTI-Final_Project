import mongoose from 'mongoose';

const extensionSchema = new mongoose.Schema(
  {
    contractId: { type: mongoose.Schema.Types.ObjectId, ref: 'Contract', required: true },
    requestedDays: { type: Number, required: true, min: 1 },
    reason: { type: String, required: true, trim: true },
    oldDeadline: { type: Date, required: true },
    proposedDeadline: { type: Date, required: true },
    status: { type: String, enum: ['PENDING', 'APPROVED', 'REJECTED'], default: 'PENDING' },
    requestedAt: { type: Date, default: Date.now },
    reviewedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

export default mongoose.models.ExtensionRequest || mongoose.model('ExtensionRequest', extensionSchema);
