import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

console.log("Cloud name:", process.env.CLOUDINARY_CLOUD_NAME);
console.log("API key ends with:", process.env.CLOUDINARY_API_KEY?.slice(-4));

console.log("\n--- Test 1: Ping ---");
try {
  const ping = await cloudinary.api.ping();
  console.log(" Ping OK:", ping);
} catch (err) {
  console.error(" Ping FAILED:", err.message);
  console.error("   Full error:", JSON.stringify(err, null, 2));
}

console.log("\n--- Test 2: Upload a test image ---");
try {
  const result = await cloudinary.uploader.upload(
    "https://res.cloudinary.com/demo/image/upload/sample.jpg",
    { folder: "saferoute/test" }
  );
  console.log(" Upload OK:", result.secure_url);
} catch (err) {
  console.error(" Upload FAILED:", err.message);
  console.error("   HTTP code:", err.http_code);
  console.error("   Full error:", JSON.stringify(err, null, 2));
}