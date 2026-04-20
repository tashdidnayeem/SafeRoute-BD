import express from "express";
import Alert from "../models/Alert.js";
import { authMiddleware, adminOnly } from "../middleware/authMiddleware.js";
import { io } from "../server.js";

const router = express.Router();


router.post("/", authMiddleware, adminOnly, async (req, res) => {
  try {
    const { title, description, severity, expiresAt, location } = req.body;

    if (!title || !description || !severity) {
      return res.status(400).json({
        message: "Title, description, and severity are required",
      });
    }

    const validSeverities = ["High", "Moderate", "Low"];
    if (!validSeverities.includes(severity)) {
      return res.status(400).json({
        message: "Severity must be High, Moderate, or Low",
      });
    }

    const alertExpiry = expiresAt
      ? new Date(expiresAt)
      : new Date(Date.now() + 24 * 60 * 60 * 1000);

    const newAlert = new Alert({
      title,
      description,
      severity,
      expiresAt: alertExpiry,
      createdBy: req.user?._id || null,
      ...(location && { location }),
    });

    const savedAlert = await newAlert.save();
    io.emit("new-alert", savedAlert); 

    res.status(201).json({
      message: "Alert created successfully",
      alert: savedAlert,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to create alert",
      error: error.message,
    });
  }
});


router.get("/latest", async (req, res) => {
  try {
    const latestAlert = await Alert.findOne({
      expiresAt: { $gt: new Date() },
    }).sort({ createdAt: -1 });

    res.status(200).json(latestAlert || null);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch latest alert",
      error: error.message,
    });
  }
});


router.get("/", async (req, res) => {
  try {
    const alerts = await Alert.find({
      expiresAt: { $gt: new Date() },
    }).sort({ createdAt: -1 });

    res.status(200).json(alerts);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch alerts",
      error: error.message,
    });
  }
});


router.delete("/:id", authMiddleware, adminOnly, async (req, res) => {
  try {
    const deletedAlert = await Alert.findByIdAndDelete(req.params.id);

    if (!deletedAlert) {
      return res.status(404).json({ message: "Alert not found" });
    }

    res.status(200).json({ message: "Alert deleted successfully" });
  } catch (error) {
    res.status(500).json({
      message: "Failed to delete alert",
      error: error.message,
    });
  }
});

export default router;