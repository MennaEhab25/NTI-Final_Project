import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const { Schema } = mongoose;

const skillEntrySchema = new Schema(
  {
    skillId: {
      type: Schema.Types.ObjectId,
      ref: "Skill",
      required: [true, "skillId is required"],
    },
    verified: {
      type: Boolean,
      default: false,
    },
    score: {
      type: Number,
      default: null,
    },
  },
  { _id: false },
);

const portfolioItemSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    image: { type: String, default: "" },
    link: { type: String, default: "" },
  },
  { _id: false },
);

const userSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: {
      type: String,
      required: [true, "Password is required"],
      select: false, // متترجعش أبدًا في query عادي
    },
    roles: {
      type: [String],
      enum: ["client", "freelancer"],
      default: ["client"],
    },
    activeRole: {
      type: String,
      enum: ["client", "freelancer"],
      default: "client",
    },
    avatarUrl: {
      type: String,
      default: "",
    },
    bio: {
      type: String,
      default: "",
    },
    title: {
      type: String,
      default: "", // professional title
    },
    skills: {
      type: [skillEntrySchema],
      default: [],
    },
    portfolio: {
      type: [portfolioItemSchema],
      default: [],
    },
    ratingAverage: {
      type: Number,
      default: 0,
    },
    reviewsCount: {
      type: Number,
      default: 0,
    },
    clientStats: {
      totalSpent: { type: Number, default: 0 },
      completedProjects: { type: Number, default: 0 },
      hireRate: { type: Number, default: 0 },
    },
    freelancerStats: {
      completedJobs: { type: Number, default: 0 },
      onTimeRate: { type: Number, default: 0 },
    },
    isVerifiedEmail: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ["active", "suspended"],
      default: "active",
    },
    refreshToken: {
      type: String,
      select: false,
    },
    passwordResetToken: {
      type: String,
      select: false,
    },
    passwordResetExpires: {
      type: Date,
      select: false,
    },
  },
  { timestamps: true },
);

// عدم السماح بتكرار نفس skillId في مصفوفة skills بتاعة نفس المستخدم
userSchema.path("skills").validate(function (skills) {
  const ids = skills.map((s) => s.skillId.toString());
  return new Set(ids).size === ids.length;
}, "Duplicate skill entries are not allowed");

userSchema.pre("save", async function (next) {
  if (!this.isModified("passwordHash")) return next();
  this.passwordHash = await bcrypt.hash(this.passwordHash, 12);
  next();
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.passwordHash);
};

const User = mongoose.model("User", userSchema);

export default User;
