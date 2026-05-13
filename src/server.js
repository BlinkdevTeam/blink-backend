"use strict";

// ── LOAD ENV FIRST ─────────────────────────────────────────
require("dotenv").config();

// ── LOAD MODELS ────────────────────────────────────────────
require("./models");

// ── IMPORT DEPENDENCIES ────────────────────────────────────
const express = require("express");
const cookieParser = require("cookie-parser");

const app = express();

const config = require("./config");
const { connectDB } = require("./config/database");

// ── MIDDLEWARE ─────────────────────────────────────────────
const corsMiddleware = require("./config/cors");

app.use(corsMiddleware);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ── ROUTES ─────────────────────────────────────────────────

// ── SETUP ROUTES ───────────────────────────────────────────
const setupRoutes = require("./modules/auth/routes/setupRoutes");
app.use("/api/setup", setupRoutes);

// ── AUTH ROUTES ────────────────────────────────────────────
const authRoutes = require("./modules/auth/routes/authRoutes");
app.use("/api/auth", authRoutes);

// ── PERMISSION ROUTES ──────────────────────────────────────
const permissionRoutes = require("./modules/auth/routes/permissionRoutes");

app.use("/api/permissions", permissionRoutes);

// ── ROLE ROUTES ────────────────────────────────────────────
const roleRoutes = require("./modules/auth/routes/roleRoutes");

app.use("/api/roles", roleRoutes);

// ── EMPLOYEE ROUTES ────────────────────────────────────────
const employeeRoutes = require("./modules/hris/routes/employeeRoutes");

// IMPORTANT FIX:
// frontend calls /api/employees/*
app.use("/api/employees", employeeRoutes);

// ── DEPARTMENT ROUTES ──────────────────────────────────────
const departmentRoutes = require("./modules/hris/routes/departmentRoutes");

app.use("/api/departments", departmentRoutes);

// ── STATS ROUTES ───────────────────────────────────────────
const statsRoutes = require("./modules/hris/routes/stats");

app.use("/api", statsRoutes);

// ── HEALTH ROUTES ──────────────────────────────────────────
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
    message: err.message || "Internal Server Error",
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
