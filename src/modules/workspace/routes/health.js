"use strict";

const express = require("express");
const router = express.Router();

// GET /api/health
router.get("/", (req, res) => {
  res.status(200).json({
    status: "ok",
    app: "tasks",
    environment: process.env.NODE_ENV || "development",
    timestamp: new Date().toISOString(),
    uptime: `${Math.floor(process.uptime())}s`,
  });
});

module.exports = router;