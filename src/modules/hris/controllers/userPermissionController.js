"use strict";

const { RolePermission, Employee, Role } = require("../../../models");

// ─────────────────────────────────────────
// GET USER PERMISSIONS
// ─────────────────────────────────────────
exports.getUserPermissions = async (req, res) => {
  try {
    const { id } = req.params;

    const employee = await Employee.findByPk(id, {
      include: [
        {
          model: Role,
        },
      ],
    });

    if (!employee) {
      return res.status(404).json({
        message: "Employee not found",
      });
    }

    const permissions = await RolePermission.findAll({
      where: {
        role_id: employee.role_id,
      },
      attributes: ["permission_id"],
    });

    res.json({
      permissions: permissions.map((p) => p.permission_id),
    });
  } catch (err) {
    console.error("Failed to fetch user permissions:", err);

    res.status(500).json({
      message: "Failed to fetch permissions",
      error: err.message,
    });
  }
};

// ─────────────────────────────────────────
// UPDATE USER PERMISSIONS
// ─────────────────────────────────────────
exports.updateUserPermissions = async (req, res) => {
  try {
    const { id } = req.params;

    const { permissions } = req.body;

    const employee = await Employee.findByPk(id);

    if (!employee) {
      return res.status(404).json({
        message: "Employee not found",
      });
    }

    // delete old permissions
    await RolePermission.destroy({
      where: {
        role_id: employee.role_id,
      },
    });

    // recreate permissions
    if (permissions && permissions.length > 0) {
      await RolePermission.bulkCreate(
        permissions.map((perm) => ({
          role_id: employee.role_id,
          permission_id: perm,
        })),
      );
    }

    res.json({
      message: "Permissions updated successfully",
      permissions,
    });
  } catch (err) {
    console.error("Failed to update permissions:", err);

    res.status(500).json({
      message: "Failed to update permissions",
      error: err.message,
    });
  }
};
