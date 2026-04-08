"use strict";

const cors = require("cors");

module.exports = cors({
  origin: "http://localhost:5173", // frontend URL
  credentials: true, // ⚠ allow sending cookies
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
});
