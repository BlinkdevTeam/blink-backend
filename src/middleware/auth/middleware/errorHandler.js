"use strict";

module.exports = (err, req, res, _next) => {
  const status = err.statusCode || 500;
  console.error(`[ERROR] ${req.method} ${req.originalUrl} — ${err.message}`);
  res.status(status).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
};