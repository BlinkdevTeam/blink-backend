"use strict";

const cors = require("cors");

// Comma-separated list in .env, e.g.:
// CORS_ORIGINS=http://localhost:5173,https://hris.blinkcreativestudio.com
const allowedOrigins = (process.env.CORS_ORIGINS || "http://localhost:5173")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

module.exports = cors({
  origin: (origin, callback) => {
    // Allow non-browser requests (curl, server-to-server, health checks) with no Origin header
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    console.warn(`CORS blocked request from origin: ${origin}`);
    return callback(new Error("Not allowed by CORS"));
  },
  credentials: true, // ⚠ allow sending cookies
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
});
