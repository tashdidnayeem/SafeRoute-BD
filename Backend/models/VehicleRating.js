import mongoose from "mongoose";

const vehicleRatingSchema = new mongoose.Schema(
  {
    vehicle: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vehicle",
      required: true,
    },
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
    driverBehavior: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    vehicleCondition: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    cleanliness: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      default: "",
      trim: true,
      maxlength: 500,
    },
    safetyScore: {
      type: Number,
      min: 1,
      max: 5,
    },
  },
  { timestamps: true }
);

vehicleRatingSchema.pre("validate", function (next) {
  const total = this.driverBehavior + this.vehicleCondition + this.cleanliness;
  this.safetyScore = Number((total / 3).toFixed(2));
  next();
});

export default mongoose.model("VehicleRating", vehicleRatingSchema);
