"use strict";

const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

const models = require("../../../models");

const { Employee, HrisUser, RefreshToken, LoginAttempt, PasswordResetToken } =
  models;

const { Op } = require("sequelize");

const {
  sendPasswordResetEmail,
} = require("../../../utils/auth/utils/emailService");

/* ---------------- CONFIG ---------------- */

const ACCESS_SECRET = process.env.ACCESS_SECRET || "access-secret";
const REFRESH_SECRET = process.env.REFRESH_SECRET || "refresh-secret";

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_MINUTES = 15;
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

    const validPassword = await bcrypt.compare(
      password,
      employee.password_hash,
    );

    await LoginAttempt.create({
      employee_id: employee.id,
      successful: validPassword,
      ip_address: req.ip,
      user_agent: req.headers["user-agent"],
    });

    if (!validPassword) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const hrisUser = await HrisUser.findOne({
      where: { employee_id: employee.id, is_active: true },
    });

    if (!hrisUser) {
      return res
        .status(403)
        .json({ message: "User does not have HRIS access" });
    }

    await employee.update({ last_login_at: new Date() });

    const accessToken = jwt.sign(
      { id: employee.id, role: hrisUser.role },
      ACCESS_SECRET,
      { expiresIn: "15m" },
    );

    const refreshToken = jwt.sign({ id: employee.id }, REFRESH_SECRET, {
      expiresIn: "7d",
    });

    const token_hash = crypto
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

    /* ---------------- ROLE FIX (IMPORTANT) ---------------- */
    const roleTitle =
      employee.role_title ||
      hrisUser?.role_title ||
      hrisUser?.role ||
      "Unknown Role";

    return res.json({
      success: true,
      accessToken,
      user: {
        id: employee.id,
        first_name: employee.first_name,
        last_name: employee.last_name,
        avatar_initials: employee.avatar_initials,
        email: employee.email,
        role: hrisUser.role,
        role_title: roleTitle,
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
      return res.status(401).json({ message: "No refresh token" });
    }

    const decoded = jwt.verify(refreshToken, REFRESH_SECRET);

    const token_hash = crypto
      .createHash("sha256")
      .update(refreshToken)
      .digest("hex");

    const storedToken = await RefreshToken.findOne({
      where: { token_hash, revoked_at: null },
    });

    if (!storedToken) {
      return res.status(401).json({ message: "Invalid refresh token" });
    }

    const employee = await Employee.findByPk(decoded.id);

    const hrisUser = await HrisUser.findOne({
      where: { employee_id: employee.id, is_active: true },
    });

    const accessToken = jwt.sign(
      { id: employee.id, role: hrisUser.role },
      ACCESS_SECRET,
      { expiresIn: "15m" },
    );

    /* ---------------- ROLE FIX ---------------- */
    const roleTitle =
      employee.role_title ||
      hrisUser?.role_title ||
      hrisUser?.role ||
      "Unknown Role";

    res.json({
      accessToken,
      user: {
        id: employee.id,
        first_name: employee.first_name,
        last_name: employee.last_name,
        avatar_initials: employee.avatar_initials,
        email: employee.email,
        role: hrisUser.role,
        role_title: roleTitle,
        dept: employee.department_id,
        unreadNotifications: 0,
      },
    });
  } catch (err) {
    console.error("Refresh error:", err);
    res.status(401).json({ message: "Invalid refresh token" });
  }
};

/* ---------------- LOGOUT ---------------- */

exports.logout = async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;

    if (refreshToken) {
      const token_hash = crypto
        .createHash("sha256")
        .update(refreshToken)
        .digest("hex");

      await RefreshToken.update(
        { revoked_at: new Date() },
        { where: { token_hash, revoked_at: null } },
      );
    }

    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
    });

    res.json({ success: true, message: "Logged out successfully" });
  } catch (err) {
    console.error("Logout error:", err);
    res.status(500).json({ message: "Server error during logout" });
  }
};

/* ---------------- FORGOT PASSWORD ---------------- */

exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) return res.status(400).json({ message: "Email is required" });

    const employee = await Employee.findOne({
      where: { email, is_active: true },
    });

    if (!employee) {
      return res.json({
        message: "If your email exists, a reset link will be sent.",
      });
    }

    await PasswordResetToken.update(
      { used_at: new Date() },
      { where: { employee_id: employee.id, used_at: null } },
    );

    const token = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

    const expiresAt = new Date(Date.now() + TOKEN_EXPIRY);

    await PasswordResetToken.create({
      employee_id: employee.id,
      token_hash: tokenHash,
      type: "reset",
      expires_at: expiresAt,
    });

    const resetUrl = `${process.env.FRONTEND_URL}/set-password-reset?token=${token}`;

    await sendPasswordResetEmail(email, employee.first_name, resetUrl);

    res.json({ message: "If your email exists, a reset link will be sent." });
  } catch (err) {
    console.error("Forgot Password error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/* ---------------- RESET PASSWORD ---------------- */

exports.resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({ message: "Invalid request" });
    }

    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const record = await PasswordResetToken.findOne({
      where: { token_hash: hashedToken },
    });

    if (!record || record.used_at || new Date() > record.expires_at) {
      return res.status(400).json({ message: "Invalid or expired token" });
    }

    const password_hash = await bcrypt.hash(password, 10);

    await Employee.update(
      { password_hash },
      { where: { id: record.employee_id } },
    );

    record.used_at = new Date();
    await record.save();

    res.json({ message: "Password updated successfully" });
  } catch (err) {
    console.error("Reset Password error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/* ---------------- VERIFY RESET TOKEN ---------------- */

exports.verifyResetToken = async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res
        .status(400)
        .json({ valid: false, message: "No token provided" });
    }

    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const record = await PasswordResetToken.findOne({
      where: { token_hash: hashedToken },
    });

    if (!record || record.used_at || new Date() > record.expires_at) {
      return res
        .status(400)
        .json({ valid: false, message: "Token invalid or expired" });
    }

    return res.json({ valid: true });
  } catch (err) {
    console.error("Verify token error:", err);
    return res.status(500).json({ valid: false, message: "Server error" });
  }
};

/* ---------------- EXPORT ---------------- */

module.exports = {
  login: exports.login,
  refresh: exports.refresh,
  logout: exports.logout,
  forgotPassword: exports.forgotPassword,
  resetPassword: exports.resetPassword,
  verifyResetToken: exports.verifyResetToken,
};
