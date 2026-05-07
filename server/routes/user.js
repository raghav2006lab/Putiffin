import { Router } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import User from "../models/User.js";

const router = Router();

// User Signup
router.post("/signup", async (req, res) => {
  try {
    const { full_name, email, password, phone, phone_verified } = req.body;
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ error: "User already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      full_name,
      email,
      password: hashedPassword,
      phone,
      phone_verified: !!phone_verified,
    });

    const token = jwt.sign({ id: user._id, role: "user" }, process.env.JWT_SECRET, {
      expiresIn: "30d",
    });
    res.json({
      token,
      user: {
        id: user._id,
        full_name: user.full_name,
        email: user.email,
        phone: user.phone,
        phone_verified: user.phone_verified,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// User Login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ error: "Invalid email or password" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ error: "Invalid email or password" });

    const token = jwt.sign({ id: user._id, role: "user" }, process.env.JWT_SECRET, {
      expiresIn: "30d",
    });
    res.json({
      token,
      user: {
        id: user._id,
        full_name: user.full_name,
        email: user.email,
        phone: user.phone,
        phone_verified: user.phone_verified,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Forgot Password - Step 1: Send OTP
router.post("/forgot-password", async (req, res) => {
  try {
    const { phone } = req.body;
    const user = await User.findOne({ phone });
    if (!user) return res.status(404).json({ error: "User with this phone number not found" });
    
    // In a real app, you'd trigger the OTP send here.
    // For now, we assume the frontend will call the existing /api/otp/send endpoint.
    res.json({ message: "User found. Please verify OTP to reset password." });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Reset Password - Step 2: Update password after OTP verification
router.post("/reset-password", async (req, res) => {
  try {
    const { phone, newPassword } = req.body;
    // Note: The frontend should have already verified the OTP via /api/otp/verify
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    const user = await User.findOneAndUpdate({ phone }, { password: hashedPassword });
    if (!user) return res.status(404).json({ error: "User not found" });
    
    res.json({ message: "Password reset successful! Please login with your new password." });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get/Update profile
router.get("/profile", async (req, res) => {
  // Authentication middleware would set req.user
  try {
    const auth = req.headers.authorization;
    if (!auth) return res.status(401).json({ error: "No token" });
    const decoded = jwt.verify(auth.split(" ")[1], process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select("-password");
    res.json(user);
  } catch (err) {
    res.status(401).json({ error: "Unauthorized" });
  }
});

export default router;
