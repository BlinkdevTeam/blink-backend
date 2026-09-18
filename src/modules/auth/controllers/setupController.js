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
// CHECK SETUP STATUS (ROBUST)
// ────────────────────────────────
exports.getSetupStatus = async (req, res) => {
  try {
    let superAdminRole = null;

    try {
      superAdminRole = await Role.findOne({
        where: { name: "Super Admin" }, // ← keep this, it works
      });
    } catch (err) {
      console.warn("Role table issue:", err.message);
      superAdminRole = null;
    }

    if (!superAdminRole) {
      return res.json({ success: true, exists: false });
    }

    const adminUser = await HrisUser.findOne({
      where: {
        role_id: superAdminRole.id,
        is_active: true,
      },
    });

    console.log("Role found:", superAdminRole.id, superAdminRole.name);
    console.log("User found:", adminUser?.id);

    return res.json({ success: true, exists: !!adminUser });
  } catch (err) {
    console.error("Error checking setup status:", err);
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// ────────────────────────────────
// CREATE INITIAL SETUP (ROBUST VERSION)
// ────────────────────────────────
exports.createSetup = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const { company, admin } = req.body;

    // ───────── VALIDATION ─────────
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

    // ───────── ROLE SAFE LOOKUP ─────────
    let superAdminRole = null;

    try {
      superAdminRole = await Role.findOne({
        where: { code: "super_admin" }, // ← was: name: "Super Admin"
      });
    } catch (err) {
      console.warn("Role lookup failed, will create role");
    }

    // ───────── CREATE ROLE IF MISSING ─────────
    if (!superAdminRole) {
      superAdminRole = await Role.findOne({
        where: { code: "super_admin" }, // ← was: name: "Super Admin"
        transaction,
      });
    }

    // ───────── CHECK EXISTING ADMIN ─────────
    const existingAdmin = await HrisUser.findOne({
      where: {
        role_id: superAdminRole.id,
        is_active: true,
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

    // ───────── ASSIGN PERMISSIONS ─────────
    const existingPermissions = await RolePermission.count({
      where: { role_id: superAdminRole.id },
      transaction,
    });

    if (existingPermissions === 0) {
      const allPermissions = await Permission.findAll({ transaction });

      if (allPermissions.length > 0) {
        await RolePermission.bulkCreate(
          allPermissions.map((p) => ({
            role_id: superAdminRole.id,
            permission_id: p.id,
          })),
          { transaction },
        );
      }
    }

    // ───────── HASH PASSWORD ─────────
    const hashedPassword = await bcrypt.hash(admin.password, 10);

    // ───────── EMPLOYEE CODE ─────────
    const employeeCount = await Employee.count({ transaction });
    const employeeCode = `EMP-${String(employeeCount + 1).padStart(4, "0")}`;

    // ───────── DUPLICATE EMAIL CHECK ─────────
    const existingEmployee = await Employee.findOne({
      where: { email: admin.email },
      transaction,
    });

    if (existingEmployee) {
      await transaction.rollback();
      return res.status(409).json({
        success: false,
        message: "Email already exists",
      });
    }

    // ───────── CREATE EMPLOYEE ─────────
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

    // ───────── CREATE HRIS USER ─────────
    const hrisUser = await HrisUser.create(
      {
        employee_id: employee.id,
        role_id: superAdminRole.id,
        is_active: true,
        granted_at: new Date(),
      },
      { transaction },
    );

    // ───────── COMPANY PROFILE ─────────
    const companyProfile = await CompanyProfile.create(
      {
        company_name: company.companyName,
        industry: company.industry,
        company_size: company.size,
      },
      { transaction },
    );

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
    await transaction.rollback();

    console.error("Setup error:", err);

    return res.status(500).json({
      success: false,
      message: "Initial setup failed",
      error: err.message,
    });
  }
};
