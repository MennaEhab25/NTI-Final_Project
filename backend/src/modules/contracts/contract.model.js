import mongoose from 'mongoose';

const contractSchema = new mongoose.Schema(
  {
    projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
    clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    freelancerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    proposalId: { type: mongoose.Schema.Types.ObjectId, ref: 'Proposal', required: true },
    amount: { type: Number, required: true },
    commissionRate: { type: Number, default: 10 },
    commissionAmount: { type: Number, required: true },
    freelancerAmount: { type: Number, required: true },
    revisionLimit: { type: Number, default: 2 },
    durationDays: { type: Number, required: true, min: 1 },
    startDate: { type: Date, default: null },
    deadline: { type: Date, default: null },
    status: {
      type: String,
      enum: ['AWAITING_PAYMENT', 'ACTIVE', 'SUBMITTED', 'REVISION_REQUESTED', 'COMPLETED', 'CANCELLED'],
      default: 'AWAITING_PAYMENT',
    },
    pdfUrl: { type: String, default: '' },
  },
  { timestamps: true },
);

contractSchema.index({ projectId: 1 }, { unique: true });

export default mongoose.models.Contract || mongoose.model('Contract', contractSchema);
