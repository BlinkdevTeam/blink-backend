"use strict";

const bcrypt = require("bcrypt");
const { Op } = require("sequelize");
const config = require("../../../config");

// The workspace Employee model is the one that defines email_verified,
// failed_login_attempts and locked_until. The HRIS Employee model does not,
// so with that import those fields were always undefined.
const Employee = require("../../../models/workspace/models/core/employee");
const RefreshToken = require("../../../models/auth/models/core/refreshTokens");
const {
  generateAccessToken,
  generateRefreshTokenRaw,
  hashRefreshToken,
  refreshTokenExpiresAt,
} = require("../../../utils/workspace/utils/token");

const REFRESH_COOKIE = "tasks_refresh_token";
const INVALID_CREDENTIALS = "Invalid email or password.";

// Compared against when the email doesn't exist, so response time doesn't
// reveal whether an account exists.
const DUMMY_HASH = bcrypt.hashSync("not-a-real-password", 10);

// ── Helpers ───────────────────────────────────────────────────────────────────
const isNonEmptyString = (value, max = 255) =>
  typeof value === "string" && value.length > 0 && value.length <= max;

// No maxAge here: Express 4's clearCookie lets maxAge override the expiry,
// which would stop the cookie from being cleared.
function baseCookieOptions() {
  return {
    httpOnly: config.cookie.httpOnly,
    secure: config.cookie.secure,
    sameSite: config.cookie.sameSite,
    path: "/",
  };
}

function setCookieOptions() {
  return { ...baseCookieOptions(), maxAge: config.cookie.maxAge };
}

// Atomic increment, so concurrent bad attempts can't overwrite each other's count.
async function registerFailedAttempt(employee) {
  await employee.increment("failed_login_attempts", { by: 1 });
  await employee.reload();

  if (employee.failed_login_attempts >= config.lockout.maxAttempts) {
    await employee.update({
      locked_until: new Date(Date.now() + config.lockout.durationMs),
      failed_login_attempts: 0,
    });
  }
}

// ── POST /api/auth/login ──────────────────────────────────────────────────────
async function login(req, res, next) {
  try {
    const { email, password } = req.body ?? {};

    if (!isNonEmptyString(email) || !isNonEmptyString(password, 128)) {
      return res
        .status(400)
        .json({ message: "Email and password are required." });
    }

    const employee = await Employee.findOne({
      where: { email: email.toLowerCase().trim(), is_active: true },
    });

    if (!employee) {
      await bcrypt.compare(password, DUMMY_HASH);
      return res.status(401).json({ message: INVALID_CREDENTIALS });
    }

    // Check lockout
    if (employee.locked_until && new Date() < new Date(employee.locked_until)) {
      const remainingMs = new Date(employee.locked_until) - new Date();
      const remainingMin = Math.ceil(remainingMs / 60000);
      return res.status(423).json({
        message: `Account locked. Try again in ${remainingMin} minute${remainingMin > 1 ? "s" : ""}.`,
      });
    }

    // password_hash is null until the invite is accepted — bcrypt.compare(x, null)
    // would throw and turn into a 500.
    const matches = await bcrypt.compare(
      password,
      employee.password_hash || DUMMY_HASH,
    );
    const passwordValid = Boolean(employee.password_hash) && matches;

    if (!passwordValid) {
      await registerFailedAttempt(employee);
      // Same message every time — no "N attempts remaining", which only
      // appears for accounts that exist.
      return res.status(401).json({ message: INVALID_CREDENTIALS });
    }

    // Only reveal invite status to someone who proved they know the password.
    if (!employee.email_verified) {
      return res
        .status(403)
        .json({ message: "Please accept your invite before logging in." });
    }

    // Reset lockout + update last login
    await employee.update({
      failed_login_attempts: 0,
      locked_until: null,
      last_login_at: new Date(),
    });

    // Generate tokens
    const accessToken = generateAccessToken(employee);
    const rawRefreshToken = generateRefreshTokenRaw();

    await RefreshToken.create({
      employee_id: employee.id,
      token_hash: hashRefreshToken(rawRefreshToken),
      app: "tasks",
      expires_at: refreshTokenExpiresAt(),
    });

    res.cookie(REFRESH_COOKIE, rawRefreshToken, setCookieOptions());

    return res.status(200).json({
      access_token: accessToken,
      employee: {
        id: employee.id,
        employee_code: employee.employee_code,
        first_name: employee.first_name,
        last_name: employee.last_name,
        email: employee.email,
        avatar_initials: employee.avatar_initials,
        role_title: employee.role_title,
        status: employee.status,
      },
    });
  } catch (err) {
    next(err);
  }
}

// ── POST /api/auth/refresh ────────────────────────────────────────────────────
async function refresh(req, res, next) {
  const reject = () => {
    res.clearCookie(REFRESH_COOKIE, baseCookieOptions());
    return res.status(401).json({ message: "Invalid refresh token." });
  };

  try {
    const rawToken = req.cookies?.[REFRESH_COOKIE];

    if (!rawToken) {
      return res.status(401).json({ message: "No refresh token provided." });
    }

    // One query covers unknown, revoked and expired tokens — and one message,
    // so callers can't tell which case they hit.
    const tokenRecord = await RefreshToken.findOne({
      where: {
        token_hash: hashRefreshToken(rawToken),
        app: "tasks",
        revoked_at: null,
        expires_at: { [Op.gt]: new Date() },
      },
    });

    if (!tokenRecord) return reject();

    const employee = await Employee.findByPk(tokenRecord.employee_id);

    if (!employee || !employee.is_active) return reject();

    const newAccessToken = generateAccessToken(employee);
    return res.status(200).json({ access_token: newAccessToken });
  } catch (err) {
    next(err);
  }
}

// ── POST /api/auth/logout ─────────────────────────────────────────────────────
async function logout(req, res, next) {
  try {
    const rawToken = req.cookies?.[REFRESH_COOKIE];

    if (rawToken) {
      // Revoke instead of delete, so the row stays as an audit trail.
      await RefreshToken.update(
        { revoked_at: new Date() },
        {
          where: {
            token_hash: hashRefreshToken(rawToken),
            app: "tasks",
            revoked_at: null,
          },
        },
      );
    }

    res.clearCookie(REFRESH_COOKIE, baseCookieOptions());

    return res.status(200).json({ message: "Logged out successfully." });
  } catch (err) {
    next(err);
  }
}

// ── GET /api/auth/me ──────────────────────────────────────────────────────────
async function me(req, res, next) {
  try {
    // A deactivated employee's access token stays valid until it expires,
    // so check is_active here instead of trusting the token alone.
    const employee = await Employee.findOne({
      where: { id: req.user.sub, is_active: true },
      attributes: [
        "id",
        "employee_code",
        "first_name",
        "last_name",
        "email",
        "avatar_initials",
        "role_title",
        "status",
      ],
    });

    if (!employee) {
      return res
        .status(401)
        .json({ message: "Employee not found or inactive." });
    }

    return res.status(200).json({ employee });
  } catch (err) {
    next(err);
  }
}

module.exports = { login, refresh, logout, me };
