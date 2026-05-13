"use strict";

const express = require("express");
const router = express.Router();

const {
  createRole,
  getRoles,
  getRoleById,
  deleteRole,
} = require("../controllers/roleController");

// ─────────────────────────────────────────
// CREATE ROLE
// POST /api/roles
// ─────────────────────────────────────────
router.post("/", createRole);

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
// DELETE ROLE
// DELETE /api/roles/:id
// ─────────────────────────────────────────
router.delete("/:id", deleteRole);

module.exports = router;
