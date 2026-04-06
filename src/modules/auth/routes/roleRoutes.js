"use strict";

const express = require("express");
const router = express.Router();

const { Role, RolePermission } = require("../models");
const { createRole } = require("../controllers/roleController");

// ─────────────────────────────────────────
// CREATE ROLE
// POST /api/roles
// ─────────────────────────────────────────
router.post("/", createRole);

// ─────────────────────────────────────────
// GET ALL ROLES WITH PERMISSIONS
// GET /api/roles
// ─────────────────────────────────────────
router.get("/", async (_req, res) => {
  try {
    const roles = await Role.findAll({
      include: [
        {
          model: RolePermission,
          attributes: ["module", "permission"],
        },
      ],
      order: [["created_at", "ASC"]],
    });

    const formatted = roles.map((role) => ({
      id: role.id,
      name: role.name,
      is_system: role.is_system,
      permissions: role.RolePermissions.map((p) => p.permission),
    }));

    res.json(formatted);
  } catch (err) {
    console.error("Error fetching roles:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// ─────────────────────────────────────────
// GET SINGLE ROLE
// GET /api/roles/:id
// ─────────────────────────────────────────
router.get("/:id", async (req, res) => {
  try {
    const role = await Role.findByPk(req.params.id, {
      include: [
        {
          model: RolePermission,
          attributes: ["module", "permission"],
        },
      ],
    });

    if (!role) {
      return res.status(404).json({ message: "Role not found" });
    }

    res.json({
      id: role.id,
      name: role.name,
      permissions: role.RolePermissions.map((p) => p.permission),
    });
  } catch (err) {
    console.error("Error fetching role:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// ─────────────────────────────────────────
// DELETE ROLE (optional but useful)
// DELETE /api/roles/:id
// ─────────────────────────────────────────
router.delete("/:id", async (req, res) => {
  try {
    const role = await Role.findByPk(req.params.id);

    if (!role) {
      return res.status(404).json({ message: "Role not found" });
    }

    if (role.is_system) {
      return res.status(403).json({
        message: "Cannot delete system roles (e.g. super_admin)",
      });
    }

    await RolePermission.destroy({ where: { role_id: role.id } });
    await role.destroy();

    res.json({ message: "Role deleted successfully" });
  } catch (err) {
    console.error("Error deleting role:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
