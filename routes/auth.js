import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import fs from "fs";

const router = express.Router();
const SECRET = process.env.JWT_SECRET || "supersecret";

// Admin login
router.post("/login", (req, res) => {
  const { username, password } = req.body;
  const users = JSON.parse(fs.readFileSync("./auth/users.json", "utf8"));
  const user = users.find(u => u.username === username);

  if (!user) return res.status(401).json({ error: "Invalid credentials" });

  bcrypt.compare(password, user.passwordHash, (err, match) => {
    if (!match) return res.status(401).json({ error: "Invalid credentials" });

    const token = jwt.sign({ username }, SECRET, { expiresIn: "1h" });
    res.json({ token });
  });
});

// Verify token
router.get("/verify", (req, res) => {
  const token = req.headers["authorization"];
  if (!token) return res.status(401).json({ error: "No token" });

  jwt.verify(token.split(" ")[1], SECRET, (err, decoded) => {
    if (err) return res.status(401).json({ error: "Invalid token" });
    res.json({ valid: true, decoded });
  });
});

export default router;
