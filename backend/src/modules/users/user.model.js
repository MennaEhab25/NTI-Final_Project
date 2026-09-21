import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const { Schema } = mongoose;

const skillEntrySchema = new Schema({
  skillId: { type: Schema.Types.ObjectId, ref: 'Skill', required: true },
  verified: { type: Boolean, default: false },
  score: { type: Number, default: null },
}, { _id: false });

const portfolioItemSchema = new Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  image: { type: String, default: '' },
  link: { type: String, default: '' },
}, { _id: false });

const userSchema = new Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true, select: false },
  roles: { type: [String], enum: ['client', 'freelancer'], default: ['client'] },
  activeRole: { type: String, enum: ['client', 'freelancer'], default: 'client' },
  isAdmin: { type: Boolean, default: false },
  avatarUrl: { type: String, default: '' },
  bio: { type: String, default: '' },
  title: { type: String, default: '' },
  skills: { type: [skillEntrySchema], default: [] },
  portfolio: { type: [portfolioItemSchema], default: [] },
  ratingAverage: { type: Number, default: 0 },
  reviewsCount: { type: Number, default: 0 },
  clientStats: {
    totalSpent: { type: Number, default: 0 },
    completedProjects: { type: Number, default: 0 },
    hireRate: { type: Number, default: 0 },
  },
  freelancerStats: {
    completedJobs: { type: Number, default: 0 },
    onTimeRate: { type: Number, default: 0 },
  },
  isVerifiedEmail: { type: Boolean, default: false },
  status: { type: String, enum: ['active', 'suspended'], default: 'active' },
  refreshToken: { type: String, select: false },
  passwordResetToken: { type: String, select: false },
  passwordResetExpires: { type: Date, select: false },
}, { timestamps: true });

userSchema.path('skills').validate(function (skills) {
  const ids = skills.map((item) => String(item.skillId));
  return new Set(ids).size === ids.length;
}, 'Duplicate skill entries are not allowed');

userSchema.pre('save', async function (next) {
  if (!this.isModified('passwordHash')) return next();
  this.passwordHash = await bcrypt.hash(this.passwordHash, 12);
  next();
});

userSchema.methods.comparePassword = function (password) {
  return bcrypt.compare(password, this.passwordHash);
};

export default mongoose.models.User || mongoose.model('User', userSchema);
