"use strict";

module.exports = function requireSuperAdmin(req, res, next) {
  try {
    const user = req.user; // assuming auth middleware attaches user to req

    if (!user || user.role !== "super_admin") {
      return res.status(403).json({
        message: "Access denied. Super Admin only.",
      });
    }

    next();
  } catch (err) {
    return res.status(500).json({
      message: "Authorization error",
      error: err.message,
    });
  }
};
