import { Router } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { getConfig } from "../models/RestaurantConfig.js";

import { adminAuth } from "../middleware/auth.js";

const router = Router();

// Admin login — compare plain-text password from env
router.post("/login", async (req, res) => {
  try {
    const { password } = req.body;
    const adminPwd = process.env.ADMIN_PASSWORD;
    if (!adminPwd) return res.status(500).json({ error: "ADMIN_PASSWORD not configured" });

    if (password !== adminPwd) {
      return res.status(401).json({ error: "Invalid password" });
    }

    const token = jwt.sign({ role: "admin" }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });
    res.json({ token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get restaurant config
router.get("/config", async (_req, res) => {
  try {
    const cfg = await getConfig();
    res.json({ is_open: cfg.is_open });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Toggle restaurant open/close (admin only)
router.put("/config", adminAuth, async (req, res) => {
  try {
    const cfg = await getConfig();
    cfg.is_open = req.body.is_open ?? !cfg.is_open;
    await cfg.save();
    res.json({ is_open: cfg.is_open });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
