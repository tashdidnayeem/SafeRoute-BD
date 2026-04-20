import mongoose from "mongoose";

const platformFeedbackSchema = new mongoose.Schema(
  {
    userName: {
      type: String,
      default: "Anonymous User",
      trim: true,
    },
    userEmail: {
      type: String,
      default: "",
      trim: true,
      lowercase: true,
    },
    platformExperience: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    usability: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    effectiveness: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      default: "",
      trim: true,
      maxlength: 800,
    },
  },
  { timestamps: true }
);

export default mongoose.model("PlatformFeedback", platformFeedbackSchema);
