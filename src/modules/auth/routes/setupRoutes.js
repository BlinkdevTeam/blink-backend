"use strict";

const express = require("express");
const router = express.Router();
const setupController = require("../controllers/setupController");

// Health check
router.get("/", (_req, res) =>
  res.json({ message: "Setup endpoint is alive" }),
);

// Check setup status
router.get("/status", setupController.getSetupStatus);

// Initial setup
router.post("/", setupController.createSetup);

// alias
router.get("/check-super-admin", setupController.getSetupStatus);

module.exports = router;
