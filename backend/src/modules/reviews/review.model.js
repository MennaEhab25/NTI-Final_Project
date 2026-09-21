// SCAFFOLD ONLY | Owner: Person 1. Implement here; not imported by the demo.
import mongoose from "mongoose";

const { Schema } = mongoose;

const reviewSchema = new Schema(
  {
    contractId: {
      type: Schema.Types.ObjectId,
      ref: "Contract",
      required: [true, "contractId is required"],
    },
    reviewerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "reviewerId is required"],
    },
    revieweeId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "revieweeId is required"],
    },
    rating: {
      overall: {
        type: Number,
        required: [true, "Overall rating is required"],
        min: 1,
        max: 5,
      },
      communication: { type: Number, min: 1, max: 5 },
      quality: { type: Number, min: 1, max: 5 },
      deadline: { type: Number, min: 1, max: 5 },
    },
    comment: {
      type: String,
      default: "",
      trim: true,
    },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

// مستخدم واحد مايقدرش يعمل أكتر من review على نفس الـ contract
reviewSchema.index({ contractId: 1, reviewerId: 1 }, { unique: true });

const Review = mongoose.model("Review", reviewSchema);

export default Review;
