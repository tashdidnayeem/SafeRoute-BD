import { v2 as cloudinary } from "cloudinary";
import multer from "multer";
import path from "path";
import fs from "fs";
import dotenv from "dotenv";

dotenv.config();

// Configure cloudinary (used if CLOUDINARY_* env vars are set)
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure:     true,
});

// ── Local disk storage (works without any cloud credentials) ──────────────────
// Files land in Backend/uploads/  and are served at /uploads/<filename>
const UPLOAD_DIR = path.resolve("uploads");
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const diskStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename:    (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e6)}`;
    cb(null, `${unique}${path.extname(file.originalname)}`);
  },
});

const multerInstance = multer({
  storage: diskStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(null, false); // silently reject non-images
    }
  },
});

// Wrap upload.single so multer errors forward to Express error handler
export const upload = {
  single: (fieldName) => (req, res, next) => {
    multerInstance.single(fieldName)(req, res, (err) => {
      if (err) return next(err);

      // Attach a fake `path` that mirrors what Cloudinary storage used to give,
      // so reportRoutes.js can read req.file.path without changes.
      if (req.file) {
        req.file.path = `/uploads/${req.file.filename}`;
      }

      next();
    });
  },
};

export default cloudinary;
