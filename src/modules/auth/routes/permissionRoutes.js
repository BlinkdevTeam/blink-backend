"use strict";

const express = require("express");

const router = express.Router();

const requireSuperAdmin = require("../../../middleware/auth/middleware/roleMiddleware");

const { getAllPermissions } = require("../controllers/permissionController");

// Note: /api/permissions is already mounted behind `protect` in server.js,
// so this already requires a valid access token. Restricting further to
// Super Admin since this only feeds role/permission management UI.

// GET ALL PERMISSIONS — Super Admin only
router.get("/", requireSuperAdmin, getAllPermissions);

module.exports = router;
