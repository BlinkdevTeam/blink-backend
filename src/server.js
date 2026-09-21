"use strict";

// ── LOAD ENV FIRST ─────────────────────────────────────────
require("dotenv").config();

// ── LOAD MODELS ────────────────────────────────────────────
require("./models");

// ── IMPORT DEPENDENCIES ────────────────────────────────────
const express = require("express");
const helmet = require("helmet");
const cookieParser = require("cookie-parser");
const rateLimit = require("express-rate-limit");

const app = express();

const config = require("./config");
const { connectDB } = require("./config/database");

// ── AUTH MIDDLEWARE ────────────────────────────────────────
const { protect } = require("./middleware/auth/middleware/authMiddleware");

// ── SECURITY MIDDLEWARE ────────────────────────────────────
app.use(helmet());

// Trust proxy if running behind a reverse proxy (needed for rate-limit + secure cookies in prod)
if (config.env === "production") {
  app.set("trust proxy", 1);
}

// General API rate limit — generous, just stops abuse/scraping
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
});

// Tighter limit for auth endpoints — brute-force protection
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many attempts. Please try again later.",
  },
});

app.use("/api", apiLimiter);

// ── MIDDLEWARE ─────────────────────────────────────────────
const corsMiddleware = require("./config/cors");

app.use(corsMiddleware);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ── ROUTES ─────────────────────────────────────────────────

// ── SETUP ROUTES (public — only usable before first admin exists) ──
const setupRoutes = require("./modules/auth/routes/setupRoutes");
app.use("/api/setup", setupRoutes);

// ── AUTH ROUTES (public, but rate-limited) ──────────────────
const authRoutes = require("./modules/auth/routes/authRoutes");
app.use("/api/auth", authLimiter, authRoutes);

// ── PERMISSION ROUTES (protected) ───────────────────────────
const permissionRoutes = require("./modules/auth/routes/permissionRoutes");
app.use("/api/permissions", protect, permissionRoutes);

// ── ROLE ROUTES (protected) ─────────────────────────────────
const roleRoutes = require("./modules/auth/routes/roleRoutes");
app.use("/api/roles", protect, roleRoutes);

// ── USER ROUTES (protected) ─────────────────────────────────
const usersRoutes = require("./modules/auth/routes/userRoutes");
app.use("/api/users", protect, usersRoutes);

// ── EMPLOYEE ROUTES (protected) ─────────────────────────────
const employeeRoutes = require("./modules/hris/routes/employeeRoutes");
app.use("/api/employees", protect, employeeRoutes);

// ── DEPARTMENT ROUTES (protected) ───────────────────────────
const departmentRoutes = require("./modules/hris/routes/departmentRoutes");
app.use("/api/departments", protect, departmentRoutes);

// ── STATS ROUTES (protected) ────────────────────────────────
const statsRoutes = require("./modules/hris/routes/stats");
app.use("/api", protect, statsRoutes);

// ── HEALTH ROUTES (public — needed for uptime checks) ───────
const healthRoutes = require("./modules/auth/routes/health");
app.use("/api", healthRoutes);

// ── ROOT CHECK ─────────────────────────────────────────────
app.get("/", (_req, res) => {
  res.json({
    success: true,
    message: "HRIS Backend API running",
    environment: config.env,
  });
});

// ── 404 HANDLER ────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

// ── GLOBAL ERROR HANDLER ───────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error("GLOBAL SERVER ERROR:", err);

  res.status(err.status || 500).json({
    success: false,
    message:
      config.env === "production"
        ? "Internal Server Error"
        : err.message || "Internal Server Error",
  });
});

// ── START SERVER ───────────────────────────────────────────
const start = async () => {
  try {
    await connectDB();

    app.listen(config.port, () => {
      console.log(`🚀 Server running on port ${config.port} [${config.env}]`);
      console.log(`🌐 API: http://localhost:${config.port}`);
    });
  } catch (err) {
    console.error("❌ Failed to start server:", err);
    process.exit(1);
  }
};

start();
