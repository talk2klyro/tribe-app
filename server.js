import express from "express";
import cors from "cors";
import morgan from "morgan";
import bodyParser from "body-parser";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors());
app.use(morgan("dev"));
app.use(bodyParser.json());

// Serve static frontend
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use(express.static(path.join(__dirname, "public")));

// Routes
import storesRoute from "./routes/stores.js";
import profilesRoute from "./routes/profiles.js";
import analyticsRoute from "./routes/analytics.js";
import authRoute from "./routes/auth.js";

app.use("/api/stores", storesRoute);
app.use("/api/profiles", profilesRoute);
app.use("/api/analytics", analyticsRoute);
app.use("/api/auth", authRoute);

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
