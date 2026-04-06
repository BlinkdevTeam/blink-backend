"use strict";

const express = require("express");
const router = express.Router();
const config = require("../config"); // use centralized config

router.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    app: "hris", // not hardcoded backend name
    env: config.env, // read from config/index.js
    uptime: `${Math.floor(process.uptime())}s`, // string format
    timestamp: new Date().toISOString(),
  });
});

module.exports = router;
