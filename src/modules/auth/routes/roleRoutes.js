"use strict";

const express = require("express");
const router = express.Router();

const requireSuperAdmin = require("../../../middleware/auth/middleware/roleMiddleware");

const {
  createRole,
  getRoles,
  getRoleById,
  deleteRole,
} = require("../controllers/roleController");

// Note: /api/roles is already mounted behind `protect` in server.js,
// so every route below already requires a valid access token.

// ─────────────────────────────────────────
// CREATE ROLE — Super Admin only
// POST /api/roles
// ─────────────────────────────────────────
router.post("/", requireSuperAdmin, createRole);

// ─────────────────────────────────────────
// GET ALL ROLES
// GET /api/roles
// ─────────────────────────────────────────
router.get("/", getRoles);

// ─────────────────────────────────────────
// GET SINGLE ROLE
// GET /api/roles/:id
// ─────────────────────────────────────────
router.get("/:id", getRoleById);

// ─────────────────────────────────────────
// DELETE ROLE — Super Admin only
// DELETE /api/roles/:id
// ─────────────────────────────────────────
router.delete("/:id", requireSuperAdmin, deleteRole);

module.exports = router;
