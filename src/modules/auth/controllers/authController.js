"use strict";

const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { Op } = require("sequelize");

const {
  sequelize,
  Employee,
  HrisUser,
  Role,
  RefreshToken,
  LoginAttempt,
  PasswordResetToken,
} = require("../../../models");

const {
  sendPasswordResetEmail,
} = require("../../../utils/auth/utils/emailService");

/* ---------------- CONFIG ---------------- */

const isProd = process.env.NODE_ENV === "production";

// Fail fast at boot instead of silently signing tokens with a known default.
function requireSecret(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  if (isProd && value.length < 32) {
    throw new Error(`${name} must be at least 32 characters in production`);
  }
  return value;
}

const ACCESS_SECRET = requireSecret("ACCESS_SECRET");
const REFRESH_SECRET = requireSecret("REFRESH_SECRET");

if (ACCESS_SECRET === REFRESH_SECRET) {
  throw new Error("ACCESS_SECRET and REFRESH_SECRET must be different");
}

const JWT_ALG = "HS256";
const ACCESS_TTL = "15m";
const REFRESH_TTL = "7d";
const REFRESH_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour for forgot-password

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_MINUTES = 15;

const REFRESH_COOKIE = "refreshToken";

// Used for both res.cookie and res.clearCookie — the options must match
// or the browser won't clear the cookie.
const refreshCookieOptions = {
  httpOnly: true,
  secure: isProd,
  sameSite: isProd ? "strict" : "lax",
};

const GENERIC_RESET_RESPONSE = {
  message: "If your email exists, a reset link will be sent.",
};

// Compared against when the email doesn't exist / has no password yet, so
// response time doesn't reveal whether an account exists.
const DUMMY_HASH = bcrypt.hashSync("not-a-real-password", 10);

/* ---------------- HELPERS ---------------- */

const sha256 = (value) =>
  crypto.createHash("sha256").update(value).digest("hex");

const isNonEmptyString = (value, max = 255) =>
  typeof value === "string" && value.length > 0 && value.length <= max;

const normalizeEmail = (email) => email.toLowerCase().trim();

// Mirrors the frontend rule (8+ chars and at least 3 of 5 checks).
// bcrypt ignores everything past 72 bytes, so cap the length there.
function validatePassword(password) {
  if (typeof password !== "string") return "Password is required";
  if (password.length < 8) return "Password must be at least 8 characters";
  if (password.length > 72) return "Password must be at most 72 characters";

  const score = [
    password.length >= 8,
    /[A-Z]/.test(password),
    /[a-z]/.test(password),
    /[0-9]/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ].filter(Boolean).length;

  return score < 3 ? "Password is too weak" : null;
}

const signAccessToken = (employeeId) =>
  jwt.sign({ id: employeeId }, ACCESS_SECRET, {
    algorithm: JWT_ALG,
    expiresIn: ACCESS_TTL,
  });

const signRefreshToken = (employeeId) =>
  jwt.sign({ id: employeeId }, REFRESH_SECRET, {
    algorithm: JWT_ALG,
    expiresIn: REFRESH_TTL,
  });

// HrisUser has role_id (not a `role` column) — load the Role through the association.
const findActiveHrisUser = (employeeId) =>
  HrisUser.findOne({
    where: { employee_id: employeeId, is_active: true },
    include: [
      { model: Role, attributes: ["id", "name", "code"], required: false },
    ],
  });

function buildUserPayload(employee, hrisUser) {
  const role = hrisUser.Role;

  return {
    id: employee.id,
    first_name: employee.first_name,
    last_name: employee.last_name,
    avatar_initials: employee.avatar_initials,
    email: employee.email,
    role: role?.code ?? null,
    role_id: hrisUser.role_id,
    role_title: role?.name || employee.role_title || "Unknown Role",
    dept: employee.department_id,
    unreadNotifications: 0,
  };
}

/* ---------------- LOGIN ---------------- */

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body ?? {};

    if (!isNonEmptyString(email) || !isNonEmptyString(password, 128)) {
      return res
        .status(400)
        .json({ message: "Email and password are required" });
    }

    const employee = await Employee.findOne({
      where: { email: normalizeEmail(email), is_active: true },
    });

    if (!employee) {
      await bcrypt.compare(password, DUMMY_HASH);
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

    // password_hash is null for invited users who haven't set a password yet —
    // bcrypt.compare(password, null) would throw and return a 500.
    const passwordMatches = await bcrypt.compare(
      password,
      employee.password_hash || DUMMY_HASH,
    );
    const validPassword = Boolean(employee.password_hash) && passwordMatches;

    await LoginAttempt.create({
      employee_id: employee.id,
      successful: validPassword,
      ip_address: req.ip,
      user_agent: req.headers["user-agent"],
    });

    if (!validPassword) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const hrisUser = await findActiveHrisUser(employee.id);

    if (!hrisUser) {
      return res
        .status(403)
        .json({ message: "User does not have HRIS access" });
    }

    await employee.update({ last_login_at: new Date() });

    const accessToken = signAccessToken(employee.id);
    const refreshToken = signRefreshToken(employee.id);

    await RefreshToken.create({
      employee_id: employee.id,
      app: "hris",
      token_hash: sha256(refreshToken),
      expires_at: new Date(Date.now() + REFRESH_TTL_MS),
    });

    res.cookie(REFRESH_COOKIE, refreshToken, {
      ...refreshCookieOptions,
      maxAge: REFRESH_TTL_MS,
    });

    return res.json({
      success: true,
      accessToken,
      user: buildUserPayload(employee, hrisUser),
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Server error during login" });
  }
};

/* ---------------- REFRESH ---------------- */

exports.refresh = async (req, res) => {
  const reject = (message = "Invalid refresh token") => {
    res.clearCookie(REFRESH_COOKIE, refreshCookieOptions);
    return res.status(401).json({ message });
  };

  try {
    const refreshToken = req.cookies?.[REFRESH_COOKIE];

    if (!refreshToken) {
      return res.status(401).json({ message: "No refresh token" });
    }

    let decoded;
    try {
      decoded = jwt.verify(refreshToken, REFRESH_SECRET, {
        algorithms: [JWT_ALG],
      });
    } catch {
      return reject();
    }

    // Scoped to the "hris" app (workspace tokens live in the same table),
    // and rejects revoked or expired rows.
    const storedToken = await RefreshToken.findOne({
      where: {
        token_hash: sha256(refreshToken),
        app: "hris",
        revoked_at: null,
        expires_at: { [Op.gt]: new Date() },
      },
    });

    if (!storedToken || storedToken.employee_id !== decoded.id) {
      return reject();
    }

    const employee = await Employee.findOne({
      where: { id: decoded.id, is_active: true },
    });
    const hrisUser = employee ? await findActiveHrisUser(employee.id) : null;

    if (!employee || !hrisUser) {
      return reject();
    }

    return res.json({
      accessToken: signAccessToken(employee.id),
      user: buildUserPayload(employee, hrisUser),
    });
  } catch (err) {
    console.error("Refresh error:", err);
    res.status(500).json({ message: "Server error during refresh" });
  }
};

/* ---------------- LOGOUT ---------------- */

exports.logout = async (req, res) => {
  try {
    const refreshToken = req.cookies?.[REFRESH_COOKIE];

    if (refreshToken) {
      await RefreshToken.update(
        { revoked_at: new Date() },
        { where: { token_hash: sha256(refreshToken), revoked_at: null } },
      );
    }

    res.clearCookie(REFRESH_COOKIE, refreshCookieOptions);

    res.json({ success: true, message: "Logged out successfully" });
  } catch (err) {
    console.error("Logout error:", err);
    res.status(500).json({ message: "Server error during logout" });
  }
};

/* ---------------- FORGOT PASSWORD ---------------- */

exports.forgotPassword = async (req, res) => {
  const { email } = req.body ?? {};

  if (!isNonEmptyString(email)) {
    return res.status(400).json({ message: "Email is required" });
  }

  // Respond first, then do the work — the response is identical and
  // takes the same time whether or not the account exists.
  res.json(GENERIC_RESET_RESPONSE);

  try {
    const employee = await Employee.findOne({
      where: { email: normalizeEmail(email), is_active: true },
    });

    if (!employee) return;

    // Only invalidate earlier *reset* tokens — pending invite tokens must survive.
    await PasswordResetToken.update(
      { used_at: new Date() },
      { where: { employee_id: employee.id, type: "reset", used_at: null } },
    );

    const token = crypto.randomBytes(32).toString("hex");

    await PasswordResetToken.create({
      employee_id: employee.id,
      token_hash: sha256(token),
      type: "reset",
      expires_at: new Date(Date.now() + RESET_TOKEN_TTL_MS),
    });

    const resetUrl = `${process.env.APP_BASE_URL}/login?token=${token}`;

    await sendPasswordResetEmail(employee.email, employee.first_name, resetUrl);
  } catch (err) {
    console.error("Forgot Password error:", err);
  }
};

/* ---------------- VERIFY RESET TOKEN ---------------- */
//
// Invite and forgot-password tokens both live (hashed) in PasswordResetToken.

exports.verifyResetToken = async (req, res) => {
  try {
    const { token } = req.body ?? {};

    if (!isNonEmptyString(token, 256)) {
      return res
        .status(400)
        .json({ valid: false, message: "No token provided" });
    }

    const record = await PasswordResetToken.findOne({
      where: {
        token_hash: sha256(token),
        used_at: null,
        expires_at: { [Op.gt]: new Date() },
      },
    });

    if (!record) {
      return res
        .status(400)
        .json({ valid: false, message: "Token invalid or expired" });
    }

    return res.json({ valid: true, flow: record.type });
  } catch (err) {
    console.error("Verify token error:", err);
    return res.status(500).json({ valid: false, message: "Server error" });
  }
};

/* ---------------- RESET PASSWORD ---------------- */
//
//   reset  → sets the new password
//   invite → sets the password AND activates the employee row

exports.resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body ?? {};

    if (!isNonEmptyString(token, 256) || typeof password !== "string") {
      return res.status(400).json({ message: "Invalid request" });
    }

    const passwordError = validatePassword(password);
    if (passwordError) {
      return res.status(400).json({ message: passwordError });
    }

    const record = await PasswordResetToken.findOne({
      where: {
        token_hash: sha256(token),
        used_at: null,
        expires_at: { [Op.gt]: new Date() },
      },
    });

    if (!record) {
      return res.status(400).json({ message: "Invalid or expired token" });
    }

    // Hash only after the token is known to be valid.
    const hashedPassword = await bcrypt.hash(password, 10);

    const transaction = await sequelize.transaction();

    try {
      // Consume the token atomically so two concurrent requests can't both use it.
      const [consumed] = await PasswordResetToken.update(
        { used_at: new Date() },
        { where: { id: record.id, used_at: null }, transaction },
      );

      if (consumed === 0) {
        await transaction.rollback();
        return res.status(400).json({ message: "Invalid or expired token" });
      }

      const employeeUpdates = {
        password_hash: hashedPassword,
        must_change_password: false,
      };

      if (record.type === "invite") {
        employeeUpdates.is_active = true;
        employeeUpdates.status = "active";
      }

      await Employee.update(employeeUpdates, {
        where: { id: record.employee_id },
        transaction,
      });

      // A password change should end every existing session.
      await RefreshToken.update(
        { revoked_at: new Date() },
        {
          where: { employee_id: record.employee_id, revoked_at: null },
          transaction,
        },
      );

      await transaction.commit();
    } catch (err) {
      if (!transaction.finished) await transaction.rollback();
      throw err;
    }

    return res.json({
      message:
        record.type === "invite"
          ? "Password set successfully. You can now log in."
          : "Password updated successfully",
    });
  } catch (err) {
    console.error("Reset Password error:", err);
    res.status(500).json({ message: "Server error" });
  }
};
