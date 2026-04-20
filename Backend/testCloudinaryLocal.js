import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Create a tiny test image file (1x1 red pixel PNG)
const testImagePath = path.join(process.cwd(), "test-pixel.png");
const pngBuffer = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==",
  "base64"
);
fs.writeFileSync(testImagePath, pngBuffer);
console.log("Created test image at:", testImagePath);

console.log("\n--- Uploading local file ---");
try {
  const result = await cloudinary.uploader.upload(testImagePath, {
    folder: "saferoute/test",
  });
  console.log(" Upload OK:", result.secure_url);
} catch (err) {
  console.error(" Upload FAILED:", err.message);
  console.error("   HTTP code:", err.http_code);
  console.error("   Full error:", JSON.stringify(err, null, 2));
} finally {
  // Clean up
  if (fs.existsSync(testImagePath)) {
    fs.unlinkSync(testImagePath);
  }
}