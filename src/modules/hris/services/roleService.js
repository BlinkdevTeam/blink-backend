"use strict";

const {
  sequelize,
  Role,
  RolePermission,
  Permission,
} = require("../../../models");

/**
 * Create role with permissions
 * @param {Object} roleData
 * @param {string} roleData.name
 * @param {string} roleData.description
 * @param {Array<string>} roleData.permissions
 * @returns {Promise<Role>}
 */
async function createRoleWithPermissions(roleData) {
  const transaction = await sequelize.transaction();

  try {
    const { name, description = "", permissions = [] } = roleData;

    // ────────────────────────────────
    // VALIDATION
    // ────────────────────────────────

    if (!name || name.trim().length < 2) {
      throw new Error("Role name is required");
    }

    // ────────────────────────────────
    // GENERATE ROLE CODE
    // ────────────────────────────────

    const generatedCode = name
      .toLowerCase()
      .trim()
      .replace(/\s+/g, "_")
      .replace(/[^\w]/g, "");

    // ────────────────────────────────
    // CHECK DUPLICATE ROLE
    // ────────────────────────────────

    const existingRole = await Role.findOne({
      where: {
        code: generatedCode,
      },
      transaction,
    });

    if (existingRole) {
      throw new Error("Role already exists");
    }

    // ────────────────────────────────
    // CREATE ROLE
    // ────────────────────────────────

    const role = await Role.create(
      {
        name,
        code: generatedCode,
        description,
        is_system: false,
      },
      { transaction },
    );

    if (!role || !role.id) {
      throw new Error("Role creation failed");
    }

    // ────────────────────────────────
    // FETCH PERMISSIONS
    // ────────────────────────────────

    let permissionRecords = [];

    if (permissions.length > 0) {
      permissionRecords = await Permission.findAll({
        where: {
          code: permissions,
        },
        transaction,
      });
    }

    // ────────────────────────────────
    // CREATE ROLE PERMISSIONS
    // ────────────────────────────────

    if (permissionRecords.length > 0) {
      const rolePermissions = permissionRecords.map((perm) => ({
        role_id: role.id,
        permission_id: perm.id,
      }));

      await RolePermission.bulkCreate(rolePermissions, {
        transaction,
        logging: console.log,
      });
    }

    // ────────────────────────────────
    // COMMIT
    // ────────────────────────────────

    await transaction.commit();

    console.log(
      `Role "${name}" created with ${permissionRecords.length} permissions`,
    );

    return role;
  } catch (err) {
    await transaction.rollback();

    console.error("Failed to create role with permissions:", err);

    throw err;
  }
}

module.exports = {
  createRoleWithPermissions,
};
