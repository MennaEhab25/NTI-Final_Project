import mongoose from 'mongoose';

const projectSchema = new mongoose.Schema(
  {
    clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    category: { type: String, required: true, trim: true },
    requiredSkills: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Skill' }],
    budget: { type: Number, required: true, min: 1 },
    duration: { type: Number, required: true, min: 1 },
    attachments: [{ type: String }],
    status: {
      type: String,
      enum: ['DRAFT', 'OPEN', 'AWARDED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'],
      default: 'OPEN',
    },
    acceptedProposalId: { type: mongoose.Schema.Types.ObjectId, ref: 'Proposal', default: null },
    proposalsCount: { type: Number, default: 0 },
    deadline: { type: Date, default: null },
  },
  { timestamps: true },
);

export default mongoose.models.Project || mongoose.model('Project', projectSchema);
