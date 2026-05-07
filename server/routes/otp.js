import { Router } from "express";

const router = Router();

// In-memory OTP store (phone -> { otp, session_id, expiresAt })
const otpStore = new Map();

// Send OTP via 2Factor.in
router.post("/send", async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone || !/^[6-9]\d{9}$/.test(phone)) {
      return res.status(400).json({ error: "Enter a valid 10-digit Indian mobile number" });
    }

    const apiKey = process.env.TWO_FACTOR_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "OTP service not configured" });
    }

    // Call 2Factor.in API to send OTP
    const response = await fetch(
      `https://2factor.in/API/V1/${apiKey}/SMS/${phone}/AUTOGEN/OTP1`,
      { method: "GET" }
    );
    const data = await response.json();

    if (data.Status === "Success") {
      // Store the session ID for later verification
      otpStore.set(phone, {
        session_id: data.Details,
        expiresAt: Date.now() + 10 * 60 * 1000, // 10 min expiry
      });
      res.json({ success: true, message: "OTP sent successfully" });
    } else {
      res.status(400).json({ error: data.Details || "Failed to send OTP" });
    }
  } catch (err) {
    console.error("OTP send error:", err);
    res.status(500).json({ error: "Failed to send OTP" });
  }
});

// Verify OTP via 2Factor.in
router.post("/verify", async (req, res) => {
  try {
    const { phone, otp } = req.body;
    if (!phone || !otp) {
      return res.status(400).json({ error: "Phone and OTP required" });
    }

    const apiKey = process.env.TWO_FACTOR_API_KEY;
    const stored = otpStore.get(phone);

    if (!stored || Date.now() > stored.expiresAt) {
      otpStore.delete(phone);
      return res.status(400).json({ error: "OTP expired. Please request a new one." });
    }

    // Verify via 2Factor.in API
    const response = await fetch(
      `https://2factor.in/API/V1/${apiKey}/SMS/VERIFY/${stored.session_id}/${otp}`,
      { method: "GET" }
    );
    const data = await response.json();

    if (data.Status === "Success" && data.Details === "OTP Matched") {
      otpStore.delete(phone);
      res.json({ verified: true, message: "Phone verified successfully" });
    } else {
      res.status(400).json({ error: "Invalid OTP. Please try again." });
    }
  } catch (err) {
    console.error("OTP verify error:", err);
    res.status(500).json({ error: "Failed to verify OTP" });
  }
});

// Cleanup expired OTPs periodically
setInterval(() => {
  const now = Date.now();
  for (const [phone, data] of otpStore.entries()) {
    if (now > data.expiresAt) otpStore.delete(phone);
  }
}, 60_000);

export default router;
