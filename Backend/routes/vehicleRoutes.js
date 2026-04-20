import express from "express";
import Vehicle from "../models/Vehicle.js";
import VehicleRating from "../models/VehicleRating.js";
import { refreshVehicleScore } from "../utils/vehicleScores.js";

const router = express.Router();

const buildVehicleResponse = (vehicle, req) => {
  const frontendBase =
    process.env.FRONTEND_URL || `${req.protocol}://${req.get("host")}`;
  const qrTarget = `${frontendBase.replace(/\/$/, "")}/vehicles/${vehicle._id}?source=qr`;
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=280x280&data=${encodeURIComponent(
    qrTarget
  )}`;

  return {
    ...vehicle.toObject(),
    qrTarget,
    qrImageUrl,
  };
};

// GET /api/vehicles?name=&city=&route=&minScore=&minRatings=&type=
router.get("/", async (req, res) => {
  try {
    const { name, city, route, minScore, minRatings, type } = req.query;

    const filter = {};

    if (name) {
      filter.name = { $regex: name, $options: "i" };
    }
    if (city) {
      filter.city = { $regex: city, $options: "i" };
    }
    if (route) {
      filter.route = { $regex: route, $options: "i" };
    }
    if (type) {
      filter.vehicleType = { $regex: type, $options: "i" };
    }
    if (minScore) {
      filter.averageSafetyScore = { $gte: Number(minScore) };
    }
    if (minRatings) {
      filter.totalRatings = { $gte: Number(minRatings) };
    }

    const vehicles = await Vehicle.find(filter).sort({ city: 1, name: 1 });
    res.status(200).json(vehicles.map((vehicle) => buildVehicleResponse(vehicle, req)));
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch vehicles",
      error: error.message,
    });
  }
});

router.post("/", async (req, res) => {
  try {
    const vehicle = await Vehicle.create(req.body);
    res.status(201).json(buildVehicleResponse(vehicle, req));
  } catch (error) {
    res.status(400).json({
      message: "Failed to create vehicle",
      error: error.message,
    });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id);

    if (!vehicle) {
      return res.status(404).json({ message: "Vehicle not found" });
    }

    const ratings = await VehicleRating.find({ vehicle: vehicle._id })
      .sort({ createdAt: -1 })
      .limit(8);

    // Recent incidents = ratings with safetyScore < 3 (low-rated)
    const incidents = await VehicleRating.find({
      vehicle: vehicle._id,
      safetyScore: { $lt: 3 },
    })
      .sort({ createdAt: -1 })
      .limit(5);

    res.status(200).json({
      ...buildVehicleResponse(vehicle, req),
      ratings,
      incidents,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch vehicle",
      error: error.message,
    });
  }
});

router.post("/:id/ratings", async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id);

    if (!vehicle) {
      return res.status(404).json({ message: "Vehicle not found" });
    }

    const rating = await VehicleRating.create({
      ...req.body,
      vehicle: vehicle._id,
    });

    const updatedVehicle = await refreshVehicleScore(vehicle._id);

    res.status(201).json({
      message: "Vehicle rating submitted successfully",
      rating,
      vehicle: buildVehicleResponse(updatedVehicle, req),
    });
  } catch (error) {
    res.status(400).json({
      message: "Failed to submit vehicle rating",
      error: error.message,
    });
  }
});

export default router;
