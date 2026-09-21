"use strict";

require("dotenv").config();

const env = process.env.NODE_ENV || "development";

// ── REQUIRED SECRETS ─────────────────────────────────────────
// These must never have hardcoded fallbacks. If they're missing,
// fail loudly at startup instead of silently signing JWTs with a
// secret anyone can find in the repo history.
function requireEnv(name, { allowDevFallback = false } = {}) {
  const value = process.env[name];

  if (value) return value;

  if (allowDevFallback && env !== "production") {
    console.warn(
      `⚠️  ${name} is not set — using an insecure dev-only fallback. ` +
        `Set ${name} in your .env before deploying.`,
    );
    return `insecure-dev-only-${name.toLowerCase()}`;
  }

  throw new Error(
    `Missing required environment variable: ${name}. ` +
      `Refusing to start without it.`,
  );
}

module.exports = {
  env,
  port: process.env.PORT || 5001,

  db: {
    host: process.env.DB_HOST || "localhost",
    port: process.env.DB_PORT || 5432,
    name: process.env.DB_NAME || "bcs_workspace",
    user: process.env.DB_USER || "postgres",
    password: process.env.DB_PASSWORD || "",
  },

  jwt: {
    accessSecret: requireEnv("JWT_ACCESS_SECRET", { allowDevFallback: true }),
    refreshSecret: requireEnv("JWT_REFRESH_SECRET", { allowDevFallback: true }),
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || "15m",
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d",
    refreshExpiresMs: 7 * 24 * 60 * 60 * 1000,
  },

  cookie: {
    secure: env === "production",
    sameSite: env === "production" ? "strict" : "lax",
    httpOnly: true,
    maxAge: 7 * 24 * 60 * 60 * 1000,
  },

  lockout: {
    maxAttempts: 5,
    durationMs: 15 * 60 * 1000,
  },
};
