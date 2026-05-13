"use strict";

const {
  Employee,
  HrisUser,
  Role,
  RolePermission,
  Permission,
} = require("../../../models");

const { sequelize } = require("../../../config/database");
const bcrypt = require("bcrypt");

const CompanyProfile = require("../../../models/hris/models/company/profile");

// ────────────────────────────────
// ALL SYSTEM PERMISSIONS
// ────────────────────────────────

// ────────────────────────────────
// CHECK SETUP STATUS
// ────────────────────────────────
exports.getSetupStatus = async (req, res, next) => {
  try {
    // Find super admin role
    const superAdminRole = await Role.findOne({
      where: {
        code: "super_admin",
      },
    });

    // No role yet = setup not completed
    if (!superAdminRole) {
      return res.json({
        success: true,
        exists: false,
      });
    }

    // Check if a user already has this role
    const adminUser = await HrisUser.findOne({
      where: {
        role_id: superAdminRole.id,
      },
    });

    return res.json({
      success: true,
      exists: !!adminUser,
    });
  } catch (err) {
    console.error("Error checking setup status:", err);

    return res.status(500).json({
      success: false,
      message: "Failed to check setup status",
      error: err.message,
    });
  }
};

// ────────────────────────────────
// CREATE INITIAL SETUP
// ────────────────────────────────
exports.createSetup = async (req, res, next) => {
  const transaction = await sequelize.transaction();

  try {
    const { company, admin } = req.body;

    // ────────────────────────────────
    // VALIDATIONS
    // ────────────────────────────────

    if (!company || !admin) {
      await transaction.rollback();

      return res.status(400).json({
        success: false,
        message: "Company and admin data are required",
      });
    }

    if (
      !admin.firstName ||
      !admin.lastName ||
      !admin.email ||
      !admin.password
    ) {
      await transaction.rollback();

      return res.status(400).json({
        success: false,
        message: "Incomplete admin information",
      });
    }

    // ────────────────────────────────
    // CHECK IF SETUP ALREADY EXISTS
    // ────────────────────────────────

    let superAdminRole = await Role.findOne({
      where: {
        code: "super_admin",
      },
      transaction,
    });

    if (superAdminRole) {
      const existingAdmin = await HrisUser.findOne({
        where: {
          role_id: superAdminRole.id,
        },
        transaction,
      });

      if (existingAdmin) {
        await transaction.rollback();

        return res.status(403).json({
          success: false,
          message: "Initial setup already completed",
        });
      }
    }

    // ────────────────────────────────
    // CREATE ROLE IF MISSING
    // ────────────────────────────────

    if (!superAdminRole) {
      superAdminRole = await Role.create(
        {
          name: "Super Admin",
          code: "super_admin",
          description: "System Super Administrator",
          is_system: true,
        },
        { transaction },
      );
    }

    // ────────────────────────────────
    // ASSIGN ALL PERMISSIONS
    // ────────────────────────────────

    const existingPermissions = await RolePermission.count({
      where: {
        role_id: superAdminRole.id,
      },
      transaction,
    });

    if (existingPermissions === 0) {
      // fetch all permissions
      const allPermissions = await Permission.findAll({
        transaction,
      });

      // prevent empty insert
      if (allPermissions.length > 0) {
        const permsToInsert = allPermissions.map((perm) => ({
          role_id: superAdminRole.id,
          permission_id: perm.id,
        }));

        await RolePermission.bulkCreate(permsToInsert, {
          transaction,
        });
      }
    }

    // ────────────────────────────────
    // HASH PASSWORD
    // ────────────────────────────────

    const hashedPassword = await bcrypt.hash(admin.password, 10);

    // ────────────────────────────────
    // GENERATE EMPLOYEE CODE
    // ────────────────────────────────

    const employeeCount = await Employee.count({
      transaction,
    });

    const employeeCode = `EMP-${String(employeeCount + 1).padStart(4, "0")}`;

    // ────────────────────────────────
    // CHECK EMAIL DUPLICATE
    // ────────────────────────────────

    const existingEmployee = await Employee.findOne({
      where: {
        email: admin.email,
      },
      transaction,
    });

    if (existingEmployee) {
      await transaction.rollback();

      return res.status(409).json({
        success: false,
        message: "Email already exists",
      });
    }

    // ────────────────────────────────
    // CREATE EMPLOYEE
    // ────────────────────────────────

    const employee = await Employee.create(
      {
        employee_code: employeeCode,

        first_name: admin.firstName,
        last_name: admin.lastName,
        email: admin.email,

        role_title: "Super Admin",

        employment_type: "full_time",

        hire_date: new Date(),

        password_hash: hashedPassword,

        is_active: true,
        must_change_password: false,
      },
      { transaction },
    );

    // ────────────────────────────────
    // CREATE HRIS USER
    // ────────────────────────────────

    const hrisUser = await HrisUser.create(
      {
        employee_id: employee.id,

        role_id: superAdminRole.id,

        is_active: true,

        granted_at: new Date(),
      },
      { transaction },
    );

    // ────────────────────────────────
    // CREATE COMPANY PROFILE
    // ────────────────────────────────

    const companyProfile = await CompanyProfile.create(
      {
        company_name: company.companyName,

        industry: company.industry,

        company_size: company.size,
      },
      { transaction },
    );

    // ────────────────────────────────
    // COMMIT
    // ────────────────────────────────

    await transaction.commit();

    return res.status(201).json({
      success: true,
      message: "Initial setup completed successfully",

      data: {
        employee,
        hrisUser,
        role: superAdminRole,
        company: companyProfile,
      },
    });
  } catch (err) {
    if (transaction) {
      await transaction.rollback();
    }

    console.error("Setup error:", err);

    return res.status(500).json({
      success: false,
      message: "Initial setup failed",
      error: err.message,
    });
  }
};
