import "dotenv/config";
import { config } from "dotenv";
config({ path: "../.env" });
import express from "express";
import cors from "cors";
import mongoose from "mongoose";

import adminRoutes from "./routes/admin.js";
import menuRoutes from "./routes/menu.js";
import orderRoutes from "./routes/orders.js";
import otpRoutes from "./routes/otp.js";
import userRoutes from "./routes/user.js";
import { adminAuth } from "./middleware/auth.js";

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// ── Public routes ──────────────────────────────────
// Public routes
app.use("/api/admin", adminRoutes);
app.use("/api/menu", menuRoutes);
app.use("/api/otp", otpRoutes);
app.use("/api/user", userRoutes);
app.use("/api/orders", orderRoutes);

// ── Admin-protected routes ─────────────────────────
// Menu management (POST / PUT / DELETE) already handled in menu routes
// but we protect admin-specific endpoints via selective middleware
// The routes themselves are public-read / admin-write

// Health check
app.get("/api/health", (_req, res) => res.json({ status: "ok" }));

// ── Connect to MongoDB and start ───────────────────
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error("❌ MONGODB_URI not set in .env");
  process.exit(1);
}

mongoose
  .connect(MONGODB_URI)
  .then(() => {
    console.log("✅ Connected to MongoDB");
    app.listen(PORT, () => {
      console.log(`🚀 Server running at http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err.message);
    process.exit(1);
  });
