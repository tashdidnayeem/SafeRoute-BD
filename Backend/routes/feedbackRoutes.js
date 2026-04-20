import express from "express";
import PlatformFeedback from "../models/PlatformFeedback.js";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const feedbackItems = await PlatformFeedback.find().sort({ createdAt: -1 }).limit(20);
    res.status(200).json(feedbackItems);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch platform feedback",
      error: error.message,
    });
  }
});

router.post("/", async (req, res) => {
  try {
    const feedback = await PlatformFeedback.create(req.body);
    res.status(201).json({
      message: "Feedback submitted successfully",
      feedback,
    });
  } catch (error) {
    res.status(400).json({
      message: "Failed to submit feedback",
      error: error.message,
    });
  }
});

export default router;
