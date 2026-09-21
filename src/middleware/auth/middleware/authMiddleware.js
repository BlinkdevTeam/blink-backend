"use strict";

const jwt = require("jsonwebtoken");
const { Employee, HrisUser, Role } = require("../../../models");

const env = process.env.NODE_ENV || "development";

// Must match the secret used to SIGN tokens in
// modules/auth/controllers/authController.js
const ACCESS_SECRET = process.env.ACCESS_SECRET;

if (!ACCESS_SECRET) {
  if (env === "production") {
    throw new Error(
      "Missing required environment variable: ACCESS_SECRET. Refusing to start without it.",
    );
  }
  console.warn(
    "⚠️  ACCESS_SECRET is not set — using an insecure dev-only fallback. " +
      "Set ACCESS_SECRET in your .env before deploying.",
  );
}

const EFFECTIVE_SECRET = ACCESS_SECRET || "insecure-dev-only-access-secret";

async function protect(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Authorization token required." });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, EFFECTIVE_SECRET);

    // Attach employee info to request
    const employee = await Employee.findByPk(decoded.id);
    if (!employee || !employee.is_active) {
      return res.status(401).json({ message: "Invalid or inactive account." });
    }

    const hrisUser = await HrisUser.findOne({
      where: { employee_id: employee.id, is_active: true },
      include: [{ model: Role, attributes: ["id", "name", "code"] }],
    });

    if (!hrisUser) {
      return res
        .status(403)
        .json({ message: "User does not have HRIS access." });
    }

    req.user = {
      id: employee.id,
      role: hrisUser.Role?.code ?? null,
      roleId: hrisUser.role_id,
      email: employee.email,
    };

    next();
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return res
        .status(401)
        .json({ message: "Access token expired.", code: "TOKEN_EXPIRED" });
    }
    if (err.name === "JsonWebTokenError") {
      return res.status(401).json({ message: "Invalid access token." });
    }
    console.error("Auth middleware error:", err);
    return res.status(500).json({ message: "Authentication error." });
  }
}

module.exports = { protect };
