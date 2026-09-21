"use strict";

const express = require("express");
const rateLimit = require("express-rate-limit");
const router = express.Router();
const {
  login,
  refresh,
  logout,
  forgotPassword,
  resetPassword,
  verifyResetToken,
} = require("../controllers/authController");

// NOTE: server.js currently mounts a global authLimiter (20 req / 15 min) on
// /api/auth. It also counts /refresh, which the frontend calls on every page
// load (twice in dev under StrictMode), so normal users would get throttled.
// Since each route is limited here, change that line in server.js to:
//   app.use("/api/auth", authRoutes);

const createLimiter = ({ windowMs, limit, message, ...options }) =>
  rateLimit({
    windowMs,
    limit,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message },
    ...options,
  });

// Brute-force protection — only failed attempts (status >= 400) count.
const loginLimiter = createLimiter({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  skipSuccessfulRequests: true,
  message: "Too many login attempts. Please try again later.",
});

// Each request can trigger an email, so keep this one tight.
const forgotPasswordLimiter = createLimiter({
  windowMs: 60 * 60 * 1000,
  limit: 5,
  message: "Too many reset requests. Please try again later.",
});

// Token check + password set (invite / reset links).
const tokenLimiter = createLimiter({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  message: "Too many attempts. Please try again later.",
});

// Refresh runs on every page load; logout is cheap. Generous, abuse-only.
const sessionLimiter = createLimiter({
  windowMs: 15 * 60 * 1000,
  limit: 100,
  message: "Too many requests. Please try again later.",
});

// Login
router.post("/login", loginLimiter, login);

// Refresh token
router.post("/refresh", sessionLimiter, refresh);

// Logout
router.post("/logout", sessionLimiter, logout);

// Forgot password
router.post("/forgot-password", forgotPasswordLimiter, forgotPassword);

// Reset password (used by SetPasswordView after invite / resend-invite)
router.post("/reset-password", tokenLimiter, resetPassword);

// Verify invite/reset token (used by SetPasswordView on mount)
router.post("/verify-reset-token", tokenLimiter, verifyResetToken);

module.exports = router;
