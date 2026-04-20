import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import http from "http";
import path from "path";
import { Server } from "socket.io";

import alertRoutes from "./routes/alertRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import reportRoutes from "./routes/reportRoutes.js";
import vehicleRoutes from "./routes/vehicleRoutes.js";
import feedbackRoutes from "./routes/feedbackRoutes.js";
import { seedVehicles } from "./utils/seedVehicles.js";
import { refreshAllVehicleScores } from "./utils/vehicleScores.js";

dotenv.config();
const app = express();
const server = http.createServer(app);

export const io = new Server(server, {
  cors: {
    origin: [
              "http://localhost:5173",
              "https://safe-route-bd.vercel.app"
            ],
    methods: ["GET", "POST", "PATCH", "DELETE"],
  },
});

app.use(cors({
  origin: [
    "http://localhost:5173",
    "https://safe-route-bd.vercel.app"
  ],
  credentials: true
}));
app.use(express.json());

// Serve uploaded photos as static files
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

app.use("/api/auth", authRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/alerts", alertRoutes);
app.use("/api/vehicles", vehicleRoutes);
app.use("/api/feedback", feedbackRoutes);

app.get("/", (req, res) => {
  res.send("SafeRoute BD API is running...");
});

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

mongoose
  .connect(process.env.MONGO_URI)
  .then(async () => {
    console.log("MongoDB connected");

    try {
      await seedVehicles();
      await refreshAllVehicleScores();
    } catch (err) {
      console.error("Seeding error (ignored for deploy):", err.message);
    }

    const PORT = process.env.PORT || 10000;
    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error("MongoDB connection failed:", error.message);
    process.exit(1); // IMPORTANT for Render logs clarity
  });