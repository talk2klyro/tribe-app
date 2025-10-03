import express from "express";
import fs from "fs";

const router = express.Router();

router.get("/", (req, res) => {
  const data = JSON.parse(fs.readFileSync("./data/stores.json", "utf8"));
  res.json(data);
});

export default router;
