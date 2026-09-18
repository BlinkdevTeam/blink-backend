"use strict";

const express = require("express");
const router = express.Router();
const {
  login,
  refresh,
  logout,
  forgotPassword,
  resetPassword,
  verifyResetToken,
} = require("../controllers/authController");

// Login
router.post("/login", login);

// Refresh token
router.post("/refresh", refresh);

// Logout
router.post("/logout", logout);

// Forgot password
router.post("/forgot-password", forgotPassword);

// Reset password (used by SetPasswordView after invite / resend-invite)
router.post("/reset-password", resetPassword);

// Verify invite/reset token (used by SetPasswordView on mount)
router.post("/verify-reset-token", verifyResetToken);

module.exports = router;
