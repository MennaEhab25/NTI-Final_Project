import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema(
  {
    contract: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Contract',
      required: true,
      index: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    content: { type: String, required: true, trim: true, maxlength: 2000 },
  },
  { timestamps: true }
);

export default mongoose.model('Message', messageSchema);