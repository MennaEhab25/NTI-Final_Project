import mongoose from 'mongoose';

const questionSchema = new mongoose.Schema({
  text: { type: String, required: true, trim: true },
  options: { type: [String], required: true },
  correctIndex: {
    type: Number,
    required: true,
    min: 0,
    validate: {
      validator(value) { return Array.isArray(this.options) && value < this.options.length; },
      message: 'correctIndex must point to an existing option',
    },
  },
}, { _id: true });

const skillSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true, trim: true },
  category: { type: String, required: true, trim: true },
  questions: { type: [questionSchema], default: [] },
}, { timestamps: true });

export default mongoose.models.Skill || mongoose.model('Skill', skillSchema);
