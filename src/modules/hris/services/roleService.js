"use strict";

const { sequelize, Role, RolePermission } = require("../models");

// Define all permissions
const ALL_PERMISSIONS = {
  Employees: [
    "employees.view_all",
    "employees.view_dept",
    "employees.view_own",
    "employees.create",
    "employees.edit_all",
    "employees.edit_own",
    "employees.deactivate",
  ],
  Payroll: [
    "payroll.view_all",
    "payroll.view_own",
    "payroll.run",
    "payroll.adjust",
    "payroll.configure",
  ],
  Attendance: [
    "attendance.view_all",
    "attendance.view_dept",
    "attendance.view_own",
    "attendance.correct",
    "attendance.correct_dept",
  ],
  Leave: [
    "leave.view_all",
    "leave.view_dept",
    "leave.view_own",
    "leave.file",
    "leave.approve_all",
    "leave.approve_dept",
    "leave.configure",
  ],
  Offset: [
    "offset.view_all",
    "offset.view_own",
    "offset.create",
    "offset.approve",
    "offset.void",
  ],
  Recruitment: [
    "recruitment.view",
    "recruitment.manage_jobs",
    "recruitment.manage_applicants",
    "recruitment.schedule_interviews",
    "recruitment.manage_offers",
    "recruitment.manage_onboarding",
  ],
  Tasks: [
    "tasks.view_all",
    "tasks.view_dept",
    "tasks.view_own",
    "tasks.create",
    "tasks.assign_any",
    "tasks.assign_dept",
    "tasks.manage_projects",
  ],
  System: [
    "users.manage",
    "roles.assign",
    "permissions.override",
    "system.audit_logs",
  ],
};

/**
 * Create a role and seed all permissions
 * @param {string} roleName
 * @returns {Promise<Role>}
 */
async function createRoleWithPermissions(roleName) {
  const transaction = await sequelize.transaction();

  try {
    // 1️⃣ Create role
    const role = await Role.create({ name: roleName }, { transaction });

    if (!role || !role.id) {
      throw new Error("Role creation failed, no ID returned");
    }

    // 2️⃣ Prepare permission records
    const permissionsToInsert = [];

    for (const module in ALL_PERMISSIONS) {
      for (const perm of ALL_PERMISSIONS[module]) {
        permissionsToInsert.push({
          role_id: role.id,
          module,
          permission: perm,
        });
      }
    }

    if (permissionsToInsert.length === 0) {
      throw new Error("No permissions to insert");
    }

    // 3️⃣ Bulk insert with logging
    await RolePermission.bulkCreate(permissionsToInsert, {
      transaction,
      logging: console.log, // shows SQL queries in console
    });

    // 4️⃣ Commit transaction
    await transaction.commit();

    console.log(
      `Role "${roleName}" created with ${permissionsToInsert.length} permissions`,
    );

    return role;
  } catch (err) {
    await transaction.rollback();
    console.error("Failed to create role with permissions:", err);
    throw err;
  }
}

module.exports = { createRoleWithPermissions };
