"use strict";

const { Employee, HrisUser, Role, RolePermission } = require("../models");
const { sequelize } = require("../config/database");
const bcrypt = require("bcrypt");
const CompanyProfile = require("../models/company/profile");

// ────────────────────────────────
// CHECK SETUP STATUS
// ────────────────────────────────
exports.getSetupStatus = async (req, res, next) => {
  try {
    const superAdminRole = await Role.findOne({
      where: { name: "super_admin" },
    });
    if (!superAdminRole) return res.json({ exists: false });

    const admin = await HrisUser.findOne({
      where: { role_id: superAdminRole.id },
    });

    res.json({ exists: !!admin });
  } catch (err) {
    console.error("Error getting setup status:", err);
    next(err);
  }
};

// ────────────────────────────────
// CREATE INITIAL SETUP
// ────────────────────────────────
exports.createSetup = async (req, res, next) => {
  const t = await sequelize.transaction();

  try {
    const { company, admin } = req.body;

    // Check if super admin already exists
    const superAdminRole = await Role.findOne({
      where: { name: "super_admin" },
      transaction: t,
    });
    const existingAdmin = superAdminRole
      ? await HrisUser.findOne({
          where: { role_id: superAdminRole.id },
          transaction: t,
        })
      : null;

    if (existingAdmin) {
      await t.rollback();
      return res
        .status(403)
        .json({ success: false, message: "Setup already completed" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(admin.password, 10);

    // Create employee
    const employee = await Employee.create(
      {
        employee_code: "EMP-0001",
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
      { transaction: t },
    );

    // Create super_admin role if it doesn't exist
    let superAdmin = superAdminRole;
    if (!superAdminRole) {
      superAdmin = await Role.create(
        { name: "super_admin", is_system: true },
        { transaction: t },
      );

      // Seed all permissions
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

      const permsToInsert = [];
      for (const module in ALL_PERMISSIONS) {
        for (const perm of ALL_PERMISSIONS[module]) {
          permsToInsert.push({
            role_id: superAdmin.id,
            module,
            permission: perm,
          });
        }
      }

      await RolePermission.bulkCreate(permsToInsert, { transaction: t });
    }

    // Give HRIS access
    const hrisUser = await HrisUser.create(
      {
        employee_id: employee.id,
        role_id: superAdmin.id,
        is_active: true,
        granted_at: new Date(),
      },
      { transaction: t },
    );

    // Create company profile
    const newCompany = await CompanyProfile.create(
      {
        company_name: company.companyName,
        industry: company.industry,
        company_size: company.size,
      },
      { transaction: t },
    );

    await t.commit();

    res.json({
      success: true,
      message: "Initial setup completed successfully",
      data: { employee, hrisUser, company: newCompany },
    });
  } catch (err) {
    await t.rollback();
    console.error("Setup error:", err);
    next(err);
  }
};
