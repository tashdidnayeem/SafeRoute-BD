import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import alertRoutes from "./routes/alertRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import reportRoutes from "./routes/reportRoutes.js";
import vehicleRoutes from "./routes/vehicleRoutes.js";
import feedbackRoutes from "./routes/feedbackRoutes.js";
import { seedVehicles } from "./utils/seedVehicles.js";
import { refreshAllVehicleScores } from "./utils/vehicleScores.js";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
app.use("/api/auth", authRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/alerts", alertRoutes);
app.use("/api/vehicles", vehicleRoutes);
app.use("/api/feedback", feedbackRoutes);

app.get("/", (req, res) => {
  res.send("SafeRoute BD API is running...");
});

mongoose
  .connect(process.env.MONGO_URI)
  .then(async () => {
    console.log("MongoDB connected");
    await seedVehicles();
    await refreshAllVehicleScores();
    console.log("Vehicle safety scores synced from saved ratings");

    const PORT = process.env.PORT || 1715;
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error("MongoDB connection failed:", error.message);
  });
