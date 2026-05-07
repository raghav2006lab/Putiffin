import { Router } from "express";
import MenuItem from "../models/MenuItem.js";
import { adminAuth } from "../middleware/auth.js";

const router = Router();

// Public: get available menu items (+ respects restaurant open status)
router.get("/", async (_req, res) => {
  try {
    const items = await MenuItem.find({ is_available: true }).sort("sort_order");
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: get ALL menu items
router.get("/all", adminAuth, async (_req, res) => {
  try {
    const items = await MenuItem.find().sort("sort_order");
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: add new menu item
router.post("/", adminAuth, async (req, res) => {
  try {
    const item = await MenuItem.create(req.body);
    res.status(201).json(item);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: update menu item
router.put("/:id", adminAuth, async (req, res) => {
  try {
    const item = await MenuItem.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!item) return res.status(404).json({ error: "Not found" });
    res.json(item);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: delete menu item
router.delete("/:id", adminAuth, async (req, res) => {
  try {
    await MenuItem.findByIdAndDelete(req.params.id);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
