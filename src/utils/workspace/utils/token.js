"use strict";

const jwt    = require("jsonwebtoken");
const crypto = require("crypto");
const config = require("../../../config/workspace/config");

function generateAccessToken(employee) {
  return jwt.sign(
    {
      sub:  employee.id,
      app:  "tasks",
      name: `${employee.first_name} ${employee.last_name}`,
    },
    config.jwt.accessSecret,
    { expiresIn: config.jwt.accessExpiresIn }
  );
}

function verifyAccessToken(token) {
  return jwt.verify(token, config.jwt.accessSecret);
}

function generateRefreshTokenRaw() {
  return crypto.randomBytes(64).toString("hex");
}

function hashRefreshToken(rawToken) {
  return crypto.createHash("sha256").update(rawToken).digest("hex");
}

function refreshTokenExpiresAt() {
  return new Date(Date.now() + config.jwt.refreshExpiresMs);
}

module.exports = {
  generateAccessToken,
  verifyAccessToken,
  generateRefreshTokenRaw,
  hashRefreshToken,
  refreshTokenExpiresAt,
};