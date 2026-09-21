import mongoose from 'mongoose';

const proposalSchema = new mongoose.Schema(
  {
    projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
    freelancerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    price: { type: Number, required: true, min: 1 },
    duration: { type: Number, required: true, min: 1 },
    coverLetter: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: ['PENDING', 'SHORTLISTED', 'ACCEPTED', 'REJECTED', 'WITHDRAWN'],
      default: 'PENDING',
    },
  },
  { timestamps: true },
);

proposalSchema.index({ projectId: 1, freelancerId: 1 }, { unique: true });

export default mongoose.models.Proposal || mongoose.model('Proposal', proposalSchema);
