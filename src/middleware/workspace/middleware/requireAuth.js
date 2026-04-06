"use strict";

const { verifyAccessToken } = require("../utils/token");

function requireAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Authorization token required." });
    }

    const token   = authHeader.split(" ")[1];
    const decoded = verifyAccessToken(token);

    if (decoded.app !== "tasks") {
      return res.status(403).json({ message: "Token is not valid for this app." });
    }

    req.user = decoded;
    next();
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Access token expired.", code: "TOKEN_EXPIRED" });
    }
    if (err.name === "JsonWebTokenError") {
      return res.status(401).json({ message: "Invalid access token." });
    }
    next(err);
  }
}

module.exports = requireAuth;