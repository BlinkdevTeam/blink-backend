"use strict";

require("dotenv").config();

module.exports = {
  env:  process.env.NODE_ENV || "development",
  port: process.env.PORT     || 5001,

  db: {
    host:     process.env.DB_HOST     || "localhost",
    port:     process.env.DB_PORT     || 5432,
    name:     process.env.DB_NAME     || "bcs_workspace",
    user:     process.env.DB_USER     || "postgres",
    password: process.env.DB_PASSWORD || "",
  },

  jwt: {
    accessSecret:     process.env.JWT_ACCESS_SECRET      || "bcs_access_secret_dev",
    refreshSecret:    process.env.JWT_REFRESH_SECRET     || "bcs_refresh_secret_dev",
    accessExpiresIn:  process.env.JWT_ACCESS_EXPIRES_IN  || "15m",
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d",
    refreshExpiresMs: 7 * 24 * 60 * 60 * 1000,
  },

  cookie: {
    secure:   process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
    httpOnly: true,
    maxAge:   7 * 24 * 60 * 60 * 1000,
  },

  lockout: {
    maxAttempts: 5,
    durationMs:  15 * 60 * 1000,
  },
};