import mongoose from 'mongoose';

const deliverySchema = new mongoose.Schema(
  {
    contractId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Contract',
      required: true,
      index: true,
    },
    freelancerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    message: { 
      type: String, 
      required: true 
    },
    files: [{ 
      type: String 
    }],
    version: { 
      type: Number, 
      default: 1 
    },
    status: {
      type: String,
      enum: ['SUBMITTED', 'REVISION_REQUESTED', 'APPROVED'],
      default: 'SUBMITTED',
    },
    submittedAt: { 
      type: Date, 
      default: Date.now 
    },
    reviewedAt: { 
      type: Date 
    }
  },
  { timestamps: true }
);

export default mongoose.model('Delivery', deliverySchema);