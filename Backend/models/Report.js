import mongoose from "mongoose";

const reportSchema = new mongoose.Schema(
  {
    issueType: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      required: true,
      trim: true,
    },

    incidentTime: {
      type: Date,
      required: true,
    },

    photoUrl: {
      type: String,
      default: "",
    },

    reportedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    location: {
      address: {
        type: String,
        default: "",
        trim: true,
      },
      latitude: {
        type: Number,
        required: true,
      },
      longitude: {
        type: Number,
        required: true,
      },
    },

    severity: {
      type: String,
      enum: ["Low", "Medium", "High"],
      required: true,
    },

    status: {
      type: String,
      enum: ["Pending", "Verified", "Rejected", "Resolved"],
      default: "Pending",
    },

    adminNote: {
      type: String,
      default: "",
      trim: true,
    },

    // --- AI Classification Fields ---
    aiStatus: {
      type: String,
      enum: ["Pending", "Verified", "Rejected", "Skipped"],
      default: "Skipped",
    },
    aiNote: {
      type: String,
      default: "",
      trim: true,
    },
    aiConfidence: {
      type: Number,
      default: 0,
    },
    aiSuggestedSeverity: {
      type: String,
      default: null,
    },
    // --------------------------------

    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    reviewedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

//  IMPORTANT: Handle string location automatically
reportSchema.pre("save", function (next) {
  if (typeof this.location === "string") {
    const [lat, lng] = this.location.split(",").map(Number);

    this.location = {
      address: "",
      latitude: lat,
      longitude: lng,
    };
  }

  next();
});

export default mongoose.model("Report", reportSchema);