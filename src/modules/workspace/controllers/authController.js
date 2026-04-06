"use strict";

const bcrypt       = require("bcryptjs");
const config       = require("../config");
const Employee     = require("../models/core/employee");
const RefreshToken = require("../models/core/refreshTokens");
const {
  generateAccessToken,
  generateRefreshTokenRaw,
  hashRefreshToken,
  refreshTokenExpiresAt,
  verifyAccessToken,
} = require("../utils/token");

// ── Helpers ───────────────────────────────────────────────────────────────────
function setCookieOptions() {
  return {
    httpOnly: config.cookie.httpOnly,
    secure:   config.cookie.secure,
    sameSite: config.cookie.sameSite,
    maxAge:   config.cookie.maxAge,
    path:     "/",
    
  };
}

// ── POST /api/auth/login ──────────────────────────────────────────────────────
async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required." });
    }

    const employee = await Employee.findOne({
      where: { email: email.toLowerCase().trim() },
    });

    if (!employee || !employee.is_active) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    // Check lockout
    if (employee.locked_until && new Date() < new Date(employee.locked_until)) {
      const remainingMs  = new Date(employee.locked_until) - new Date();
      const remainingMin = Math.ceil(remainingMs / 60000);
      return res.status(423).json({
        message:      `Account locked. Try again in ${remainingMin} minute${remainingMin > 1 ? "s" : ""}.`,
        locked_until: employee.locked_until,
      });
    }

    // Check email verified
    if (!employee.email_verified) {
      return res.status(403).json({ message: "Please accept your invite before logging in." });
    }

    // Check password
    const passwordValid = await bcrypt.compare(password, employee.password_hash);

    if (!passwordValid) {
      const newAttempts = (employee.failed_login_attempts || 0) + 1;
      const updates     = { failed_login_attempts: newAttempts };

      if (newAttempts >= config.lockout.maxAttempts) {
        updates.locked_until          = new Date(Date.now() + config.lockout.durationMs);
        updates.failed_login_attempts = 0;
      }

      await employee.update(updates);

      const remaining = config.lockout.maxAttempts - newAttempts;
      return res.status(401).json({
        message: remaining > 0
          ? `Invalid email or password. ${remaining} attempt${remaining > 1 ? "s" : ""} remaining.`
          : "Account locked for 15 minutes due to too many failed attempts.",
      });
    }

    // Reset lockout + update last login
    await employee.update({
      failed_login_attempts: 0,
      locked_until:          null,
      last_login_at:         new Date(),
    });

    // Generate tokens
    const accessToken     = generateAccessToken(employee);
    const rawRefreshToken = generateRefreshTokenRaw();
    const hashedToken     = hashRefreshToken(rawRefreshToken);

    await RefreshToken.create({
      employee_id: employee.id,
      token_hash:  hashedToken,
      app:         "tasks",
      expires_at:  refreshTokenExpiresAt(),
    });

    res.cookie("tasks_refresh_token", rawRefreshToken, setCookieOptions());

    return res.status(200).json({
      access_token: accessToken,
      employee: {
        id:              employee.id,
        employee_code:   employee.employee_code,
        first_name:      employee.first_name,
        last_name:       employee.last_name,
        email:           employee.email,
        avatar_initials: employee.avatar_initials,
        role_title:      employee.role_title,
        status:          employee.status,
      },
    });
  } catch (err) {
    next(err);
  }
}

// ── POST /api/auth/refresh ────────────────────────────────────────────────────
async function refresh(req, res, next) {
  try {
    const rawToken = req.cookies?.tasks_refresh_token;

    if (!rawToken) {
      return res.status(401).json({ message: "No refresh token provided." });
    }

    const hashedToken = hashRefreshToken(rawToken);
    const tokenRecord = await RefreshToken.findOne({
      where: { token_hash: hashedToken, app: "tasks" },
    });

    if (!tokenRecord)                   return res.status(401).json({ message: "Invalid refresh token." });
    if (tokenRecord.revoked_at)         return res.status(401).json({ message: "Refresh token has been revoked." });
    if (new Date() > new Date(tokenRecord.expires_at)) return res.status(401).json({ message: "Refresh token has expired." });

    const employee = await Employee.findByPk(tokenRecord.employee_id);

    if (!employee || !employee.is_active) {
      return res.status(401).json({ message: "Employee not found or inactive." });
    }

    const newAccessToken = generateAccessToken(employee);
    return res.status(200).json({ access_token: newAccessToken });
  } catch (err) {
    next(err);
  }
}

// ── POST /api/auth/logout ─────────────────────────────────────────────────────
async function logout(req, res, next) {
  try {
    const rawToken = req.cookies?.tasks_refresh_token;

    if (rawToken) {
      const hashedToken = hashRefreshToken(rawToken);
      await RefreshToken.destroy({
        where: { token_hash: hashedToken, app: "tasks" },
      });
    }

    res.clearCookie("tasks_refresh_token", {
      httpOnly: config.cookie.httpOnly,
      secure:   config.cookie.secure,
      sameSite: config.cookie.sameSite,
      path:     "/",
    });

    return res.status(200).json({ message: "Logged out successfully." });
  } catch (err) {
    next(err);
  }
}

// ── GET /api/auth/me ──────────────────────────────────────────────────────────
async function me(req, res, next) {
  try {
    const employee = await Employee.findByPk(req.user.sub, {
      attributes: [
        "id", "employee_code", "first_name", "last_name",
        "email", "avatar_initials", "role_title", "status",
      ],
    });

    if (!employee) {
      return res.status(404).json({ message: "Employee not found." });
    }

    return res.status(200).json({ employee });
  } catch (err) {
    next(err);
  }
}

module.exports = { login, refresh, logout, me };