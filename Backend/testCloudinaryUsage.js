import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

console.log("--- Fetching account usage / plan info ---");
try {
  const usage = await cloudinary.api.usage();
  console.log("Plan:", usage.plan);
  console.log("Credits:", JSON.stringify(usage.credits, null, 2));
} catch (err) {
  console.error("Usage check FAILED:", err.message);
}