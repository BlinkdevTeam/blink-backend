"use strict";

const { RolePermission, Employee, Role } = require("../../../models");

// GET USER PERMISSIONS
exports.getUserPermissions = async (req, res) => {
  try {
    const { id } = req.params;

    const employee = await Employee.findByPk(id, {
      include: [
        {
          model: Role,
          as: "role",
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
    });

    res.json(permissions);
  } catch (err) {
    console.error("Failed to fetch user permissions:", err);

    res.status(500).json({
      message: "Failed to fetch permissions",
      error: err.message,
    });
  }
};
