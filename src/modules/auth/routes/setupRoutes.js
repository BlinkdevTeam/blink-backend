"use strict";

const express = require("express");
const router = express.Router();
const {
  createSetup,
  getSetupStatus,
} = require("../controllers/setupController");

// Health check
router.get("/", (_req, res) =>
  res.json({ message: "Setup endpoint is alive" }),
);

// Check if setup completed
router.get("/status", getSetupStatus);

// Initial setup
router.post("/", createSetup);

// Check if super admin exists (same as status)
router.get("/check-super-admin", getSetupStatus);

module.exports = router;
