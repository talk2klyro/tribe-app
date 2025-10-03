import express from "express";
import { logClick, getAnalytics } from "../analytics/logger.js";

const router = express.Router();

// Log a click event
router.post("/log", (req, res) => {
  const { storeId, linkType, utm } = req.body;
  if (!storeId || !linkType) {
    return res.status(400).json({ error: "Missing fields" });
  }
  logClick({ storeId, linkType, utm });
  res.json({ success: true });
});

// Get aggregated analytics
router.get("/", (req, res) => {
  res.json(getAnalytics());
});

export default router;
