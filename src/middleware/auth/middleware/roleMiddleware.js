"use strict";

const config = require("../../../config");

/**
 * Restricts access to one or more roles.
 * Usage:
 *   router.get("/", protect, requireRole("super_admin"), handler);
 *   router.get("/", protect, requireRole("super_admin", "hr_admin"), handler);
 */
function requireRole(...allowedRoles) {
  return function (req, res, next) {
    try {
      const user = req.user; // set by the `protect` auth middleware — must run first

      if (!user) {
        return res.status(401).json({
          message: "Authentication required.",
        });
      }

      if (!user.role || !allowedRoles.includes(user.role)) {
        return res.status(403).json({
          message: "Access denied. Insufficient permissions.",
        });
      }

      next();
    } catch (err) {
      console.error("Authorization error:", err);
      return res.status(500).json({
        message: "Authorization error",
        error: config.env === "production" ? undefined : err.message,
      });
    }
  };
}

// Backwards-compatible export for existing `requireSuperAdmin` usage
const requireSuperAdmin = requireRole("super_admin");

module.exports = requireSuperAdmin;
module.exports.requireRole = requireRole;
module.exports.requireSuperAdmin = requireSuperAdmin;
