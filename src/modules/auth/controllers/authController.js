"use strict";

const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

const {
  Employee,
  HrisUser,
  RefreshToken,
  LoginAttempt,
  PasswordResetToken,
} = require("../models");
const { Op } = require("sequelize");

const { sendPasswordResetEmail } = require("../utils/emailService");

const ACCESS_SECRET = process.env.ACCESS_SECRET || "access-secret";
const REFRESH_SECRET = process.env.REFRESH_SECRET || "refresh-secret";

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_MINUTES = 15;

// Token expiry in ms (1 hour)
const TOKEN_EXPIRY = 60 * 60 * 1000;

/* ---------------- LOGIN ---------------- */

exports.login = async (req, res) => {
  try {
    let { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required" });
    }

    email = email.toLowerCase().trim();

    const employee = await Employee.findOne({
      where: { email, is_active: true },
    });

    if (!employee) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // 1️⃣ Check for lockout
    const recentFailures = await LoginAttempt.count({
      where: {
        employee_id: employee.id,
        successful: false,
        attempt_time: {
          [Op.gt]: new Date(Date.now() - LOCKOUT_MINUTES * 60 * 1000),
        },
      },
    });

    if (recentFailures >= MAX_FAILED_ATTEMPTS) {
      return res.status(403).json({
        message: `Too many failed attempts. Try again in ${LOCKOUT_MINUTES} minutes.`,
      });
    }

    // 2️⃣ Validate password
    const validPassword = await bcrypt.compare(
      password,
      employee.password_hash,
    );

    // 3️⃣ Log attempt
    await LoginAttempt.create({
      employee_id: employee.id,
      successful: validPassword,
      ip_address: req.ip,
      user_agent: req.headers["user-agent"],
    });

    if (!validPassword) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // 4️⃣ Check HRIS access
    const hrisUser = await HrisUser.findOne({
      where: { employee_id: employee.id, is_active: true },
    });

    if (!hrisUser) {
      return res
        .status(403)
        .json({ message: "User does not have HRIS access" });
    }

    await employee.update({ last_login_at: new Date() });

    // 5️⃣ Generate tokens (same as before)
    const accessToken = jwt.sign(
      { id: employee.id, role: hrisUser.role },
      ACCESS_SECRET,
      { expiresIn: "15m" },
    );

    const refreshToken = jwt.sign({ id: employee.id }, REFRESH_SECRET, {
      expiresIn: "7d",
    });
    const token_hash = require("crypto")
      .createHash("sha256")
      .update(refreshToken)
      .digest("hex");
    const expires_at = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await RefreshToken.create({
      employee_id: employee.id,
      app: "hris",
      token_hash,
      expires_at,
    });

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.json({
      success: true,
      accessToken,
      user: {
        id: employee.id,
        first_name: employee.first_name,
        last_name: employee.last_name,
        email: employee.email,
        role: hrisUser.role,
        dept: employee.department_id,
        unreadNotifications: 0,
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Server error during login" });
  }
};

/* ---------------- REFRESH ---------------- */

exports.refresh = async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
      return res.status(401).json({
        message: "No refresh token",
      });
    }

    const decoded = jwt.verify(refreshToken, REFRESH_SECRET);

    const token_hash = crypto
      .createHash("sha256")
      .update(refreshToken)
      .digest("hex");

    const storedToken = await RefreshToken.findOne({
      where: {
        token_hash,
        revoked_at: null,
      },
    });

    if (!storedToken) {
      return res.status(401).json({
        message: "Invalid refresh token",
      });
    }

    const employee = await Employee.findByPk(decoded.id);

    const hrisUser = await HrisUser.findOne({
      where: {
        employee_id: employee.id,
        is_active: true,
      },
    });

    const accessToken = jwt.sign(
      {
        id: employee.id,
        role: hrisUser.role,
      },
      ACCESS_SECRET,
      { expiresIn: "15m" },
    );

    res.json({
      accessToken,
      user: {
        id: employee.id,
        first_name: employee.first_name,
        last_name: employee.last_name,
        email: employee.email,
        role: hrisUser.role,
        dept: employee.department_id,
        unreadNotifications: 0,
      },
    });
  } catch (err) {
    console.error("Refresh error:", err);

    res.status(401).json({
      message: "Invalid refresh token",
    });
  }
};

/* ---------------- LOGOUT ---------------- */
exports.logout = async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;

    if (refreshToken) {
      const token_hash = require("crypto")
        .createHash("sha256")
        .update(refreshToken)
        .digest("hex");

      // Set revoked_at to now
      await require("../models").RefreshToken.update(
        { revoked_at: new Date() },
        { where: { token_hash, revoked_at: null } },
      );
    }

    // Clear cookie
    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: false, // true in production
      sameSite: "lax",
    });

    res.json({ success: true, message: "Logged out successfully" });
  } catch (err) {
    console.error("Logout error:", err);
    res.status(500).json({ message: "Server error during logout" });
  }
};

/* ---------------- RESET PASSWORD ---------------- */
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email is required" });

    const employee = await Employee.findOne({
      where: { email, is_active: true },
    });

    // Do not reveal if email exists
    if (!employee) {
      return res.json({
        message: "If your email exists, a reset link will be sent.",
      });
    }

    // Invalidate previous tokens
    await PasswordResetToken.update(
      { used_at: new Date() },
      { where: { employee_id: employee.id, used_at: null } }
    );

    // Generate token
    const token = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

    const expiresAt = new Date(Date.now() + TOKEN_EXPIRY);

    // ✅ FIX: include type
    await PasswordResetToken.create({
      employee_id: employee.id,
      token_hash: tokenHash,
      type: "reset",
      expires_at: expiresAt,
    });

    const resetUrl = `${process.env.FRONTEND_URL}/set-password-reset?token=${token}`;

    await sendPasswordResetEmail(
      email,
      employee.first_name,
      resetUrl
    );

    res.json({
      message: "If your email exists, a reset link will be sent.",
    });
  } catch (err) {
    console.error("Forgot Password error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({ message: "Invalid request" });
    }

    const hashedToken = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    const record = await PasswordResetToken.findOne({
      where: { token_hash: hashedToken },
    });

    if (!record) {
      return res.status(400).json({ message: "Invalid token" });
    }

    // ✅ FIX: use used_at
    if (record.used_at) {
      return res.status(400).json({ message: "Token already used" });
    }

    if (new Date() > record.expires_at) {
      return res.status(400).json({ message: "Token expired" });
    }

    const password_hash = await bcrypt.hash(password, 10);

    await Employee.update(
      { password_hash },
      { where: { id: record.employee_id } }
    );

    // ✅ FIX: mark used properly
    record.used_at = new Date();
    await record.save();

    res.json({ message: "Password updated successfully" });
  } catch (err) {
    console.error("Reset Password error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// authController.js
exports.verifyResetToken = async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) return res.status(400).json({ valid: false, message: "No token provided" });

    const hashedToken = require("crypto")
      .createHash("sha256")
      .update(token)
      .digest("hex");

    const record = await require("../models").PasswordResetToken.findOne({
      where: { token_hash: hashedToken },
    });

    if (!record || record.used_at || new Date() > record.expires_at) {
      return res.status(400).json({ valid: false, message: "Token invalid or expired" });
    }

    return res.json({ valid: true });
  } catch (err) {
    console.error("Verify token error:", err);
    return res.status(500).json({ valid: false, message: "Server error" });
  }
};