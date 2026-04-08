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

// Setup
const setupRoutes = require("./modules/auth/routes/setupRoutes");
app.use("/api/setup", setupRoutes);

// Auth
const authRoutes = require("./modules/auth/routes/authRoutes");
app.use("/api/auth", authRoutes);

// Health
const healthRoutes = require("./modules/auth/routes/health");
app.use("/api", healthRoutes);

// Stats
const statsRoutes = require("./modules/hris/routes/stats");
app.use("/api", statsRoutes);

// Employees
const employeeRoutes = require("./modules/hris/routes/employeeRoutes");
app.use("/employees", employeeRoutes);

// Departments
const departmentRoutes = require("./modules/hris/routes/departmentRoutes");
app.use("/api/departments", departmentRoutes);

// Roles
const roleRoutes = require("./modules/auth/routes/roleRoutes");
app.use("/api/roles", roleRoutes);

// ── ROOT CHECK ─────────────────────────────────────────────
app.get("/", (req, res) => {
  res.json({
    message: "HRIS Backend API running",
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
