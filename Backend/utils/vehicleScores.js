import Vehicle from "../models/Vehicle.js";
import VehicleRating from "../models/VehicleRating.js";

export const calculateVehicleScoreSummary = async (vehicleId) => {
  const stats = await VehicleRating.aggregate([
    {
      $match: {
        vehicle: vehicleId,
      },
    },
    {
      $group: {
        _id: "$vehicle",
        averageSafetyScore: { $avg: "$safetyScore" },
        totalRatings: { $sum: 1 },
        lastRatedAt: { $max: "$createdAt" },
      },
    },
  ]);

  const summary = stats[0] || {
    averageSafetyScore: 0,
    totalRatings: 0,
    lastRatedAt: null,
  };

  return {
    averageSafetyScore: Number((summary.averageSafetyScore || 0).toFixed(2)),
    totalRatings: summary.totalRatings || 0,
    lastRatedAt: summary.lastRatedAt || null,
  };
};

export const refreshVehicleScore = async (vehicleId) => {
  const summary = await calculateVehicleScoreSummary(vehicleId);

  return Vehicle.findByIdAndUpdate(vehicleId, summary, { new: true });
};

export const refreshAllVehicleScores = async () => {
  const vehicles = await Vehicle.find({}, { _id: 1 });

  if (vehicles.length === 0) {
    return [];
  }

  return Promise.all(vehicles.map((vehicle) => refreshVehicleScore(vehicle._id)));
};
