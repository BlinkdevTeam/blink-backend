"use strict";

const {
  createRoleWithPermissions,
} = require("../../hris/services/roleService");

const { Role, RolePermission } = require("../../../models");

// ─────────────────────────────────────────
// CREATE ROLE
// ─────────────────────────────────────────
exports.createRole = async (req, res) => {
  try {
    const role = await createRoleWithPermissions(req.body);

    res.status(201).json({
      message: `Role "${role.name}" created successfully`,
      role,
    });
  } catch (err) {
    console.error("Failed to create role:", err);

    res.status(500).json({
      message: "Failed to create role",
      error: err.message,
    });
  }
};

// ─────────────────────────────────────────
// GET ALL ROLES
// ─────────────────────────────────────────
exports.getRoles = async (_req, res) => {
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
      code: role.code,
      is_system: role.is_system,
      permissions: role.RolePermissions.map((p) => p.permission),
    }));

    res.json(formatted);
  } catch (err) {
    console.error("Error fetching roles:", err);

    res.status(500).json({
      message: "Failed to fetch roles",
      error: err.message,
    });
  }
};

// ─────────────────────────────────────────
// GET SINGLE ROLE
// ─────────────────────────────────────────
exports.getRoleById = async (req, res) => {
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
      return res.status(404).json({
        message: "Role not found",
      });
    }

    res.json({
      id: role.id,
      name: role.name,
      code: role.code,
      is_system: role.is_system,
      permissions: role.RolePermissions.map((p) => p.permission),
    });
  } catch (err) {
    console.error("Error fetching role:", err);

    res.status(500).json({
      message: "Failed to fetch role",
      error: err.message,
    });
  }
};

// ─────────────────────────────────────────
// DELETE ROLE
// ─────────────────────────────────────────
exports.deleteRole = async (req, res) => {
  try {
    const role = await Role.findByPk(req.params.id);

    if (!role) {
      return res.status(404).json({
        message: "Role not found",
      });
    }

    if (role.is_system) {
      return res.status(403).json({
        message: "Cannot delete system roles",
      });
    }

    await RolePermission.destroy({
      where: {
        role_id: role.id,
      },
    });

    await role.destroy();

    res.json({
      message: "Role deleted successfully",
    });
  } catch (err) {
    console.error("Error deleting role:", err);

    res.status(500).json({
      message: "Failed to delete role",
      error: err.message,
    });
  }
};
