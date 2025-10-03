import express from "express";
import fs from "fs";

const router = express.Router();

router.get("/", (req, res) => {
  const data = JSON.parse(fs.readFileSync("./data/profiles.json", "utf8"));
  res.json(data);
});

router.get("/:id", (req, res) => {
  const data = JSON.parse(fs.readFileSync("./data/profiles.json", "utf8"));
  const profile = data.find(p => p.id === parseInt(req.params.id));
  profile ? res.json(profile) : res.status(404).json({ error: "Profile not found" });
});

export default router;
