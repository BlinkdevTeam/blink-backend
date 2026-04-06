const { RolePermission } = require("../models");

const ALL_PERMISSIONS = {
  Employees: ["employees.view_all", "employees.create"],
  Payroll: ["payroll.view_all"],
};

const seedPermissionsForRole = async (roleId) => {
  const records = [];

  for (const module in ALL_PERMISSIONS) {
    for (const perm of ALL_PERMISSIONS[module]) {
      records.push({
        role_id: roleId,
        module,
        permission: perm,
      });
    }
  }

  await RolePermission.bulkCreate(records);
};

module.exports = { seedPermissionsForRole };
