// SCAFFOLD ONLY | Owner: Person 1. Implement here; not imported by the demo.
import mongoose from "mongoose";

const { Schema } = mongoose;

const questionSchema = new Schema(
  {
    text: {
      type: String,
      required: [true, "Question text is required"],
      trim: true,
    },
    options: {
      type: [String],
      validate: {
        validator: (arr) => arr.length >= 2,
        message: "A question must have at least 2 options",
      },
      required: [true, "Options are required"],
    },
    correctIndex: {
      type: Number,
      required: [true, "correctIndex is required"],
      validate: {
        validator: function (value) {
          return value >= 0 && value < this.options.length;
        },
        message: "correctIndex must point to a valid option",
      },
    },
  },
  { _id: false },
);

const skillSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, "Skill name is required"],
      unique: true,
      trim: true,
    },
    category: {
      type: String,
      required: [true, "Category is required"],
      trim: true,
    },
    questions: {
      type: [questionSchema],
      default: [],
    },
  },
  { timestamps: true },
);

const Skill = mongoose.model("Skill", skillSchema);

export default Skill;
