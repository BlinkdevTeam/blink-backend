"use strict";

const crypto = require("crypto");
const bcrypt = require("bcrypt");

const {
  sequelize,
  Employee,
  HrisUser,
  Role,
  RolePermission,
  Permission,
  CompanyProfile,
} = require("../../../models");

const SUPER_ADMIN_CODE = "super_admin";

// Arbitrary constant used for pg_advisory_xact_lock so only one setup
// request can run at a time (released automatically on commit/rollback).
const SETUP_LOCK_KEY = 7301001;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

if (process.env.NODE_ENV === "production" && !process.env.SETUP_TOKEN) {
  console.warn(
    "[setup] SETUP_TOKEN is not set — the first visitor to /api/setup can claim the Super Admin account.",
  );
}

// ────────────────────────────────
// HELPERS
// ────────────────────────────────

// If SETUP_TOKEN is configured, the request must send it
// (x-setup-token header or setupToken in the body).
function hasValidSetupToken(req) {
  const expected = process.env.SETUP_TOKEN;
  if (!expected) return true;

  const provided = req.headers["x-setup-token"] ?? req.body?.setupToken;
  if (typeof provided !== "string") return false;

  // Hash both sides so lengths match for timingSafeEqual.
  const a = crypto.createHash("sha256").update(provided).digest();
  const b = crypto.createHash("sha256").update(expected).digest();
  return crypto.timingSafeEqual(a, b);
}

// Mirrors the frontend rule (8+ chars and at least 3 of 5 checks).
// bcrypt ignores everything past 72 bytes, so cap the length there.
function validatePassword(password) {
  if (password.length < 8) return "Password must be at least 8 characters";
  if (password.length > 72) return "Password must be at most 72 characters";

  const score = [
    password.length >= 8,
    /[A-Z]/.test(password),
    /[a-z]/.test(password),
    /[0-9]/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ].filter(Boolean).length;

  return score < 3 ? "Password is too weak" : null;
}

const str = (value) => (typeof value === "string" ? value.trim() : "");

function parseSetupInput(body) {
  const { company, admin } = body ?? {};

  if (
    !company ||
    typeof company !== "object" ||
    !admin ||
    typeof admin !== "object"
  ) {
    return { error: "Company and admin data are required" };
  }

  const companyName = str(company.companyName);
  const industry = str(company.industry);
  const size = str(company.size);

  if (!companyName || !industry || !size) {
    return { error: "Company name, industry and size are required" };
  }
  if ([companyName, industry, size].some((v) => v.length > 255)) {
    return { error: "Company details are too long" };
  }

  const firstName = str(admin.firstName);
  const lastName = str(admin.lastName);
  // Login lowercases the email before lookup, so it has to be stored lowercase.
  const email = str(admin.email).toLowerCase();

  if (!firstName || !lastName || !email || typeof admin.password !== "string") {
    return { error: "Incomplete admin information" };
  }
  if (firstName.length > 100 || lastName.length > 100) {
    return { error: "Name is too long" };
  }
  if (email.length > 255 || !EMAIL_RE.test(email)) {
    return { error: "Enter a valid email address" };
  }

  const passwordError = validatePassword(admin.password);
  if (passwordError) return { error: passwordError };

  return {
    value: {
      company: { companyName, industry, size },
      admin: { firstName, lastName, email, password: admin.password },
    },
  };
}

async function isSetupComplete() {
  const role = await Role.findOne({
    where: { code: SUPER_ADMIN_CODE },
    attributes: ["id"],
  });
  if (!role) return false;

  const admin = await HrisUser.findOne({
    where: { role_id: role.id, is_active: true },
    attributes: ["id"],
  });
  return Boolean(admin);
}

// ────────────────────────────────
// CHECK SETUP STATUS
// ────────────────────────────────
exports.getSetupStatus = async (_req, res) => {
  try {
    return res.json({ success: true, exists: await isSetupComplete() });
  } catch (err) {
    console.error("Error checking setup status:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to check setup status",
    });
  }
};

// ────────────────────────────────
// CREATE INITIAL SETUP
// ────────────────────────────────
exports.createSetup = async (req, res) => {
  try {
    if (!hasValidSetupToken(req)) {
      return res.status(403).json({
        success: false,
        message: "Invalid setup token",
      });
    }

    const parsed = parseSetupInput(req.body);
    if (parsed.error) {
      return res.status(400).json({ success: false, message: parsed.error });
    }
    const { company, admin } = parsed.value;

    // Cheap check first, so nobody can burn bcrypt CPU after setup is done.
    if (await isSetupComplete()) {
      return res.status(403).json({
        success: false,
        message: "Initial setup already completed",
      });
    }

    const hashedPassword = await bcrypt.hash(admin.password, 10);

    const transaction = await sequelize.transaction();

    try {
      // Serialize concurrent setup requests: without this, two requests can
      // both pass the "no admin yet" check and create two Super Admins.
      await sequelize.query("SELECT pg_advisory_xact_lock(:key)", {
        replacements: { key: SETUP_LOCK_KEY },
        transaction,
      });

      const [superAdminRole] = await Role.findOrCreate({
        where: { code: SUPER_ADMIN_CODE },
        defaults: {
          name: "Super Admin",
          description: "Full system access",
          is_system: true,
        },
        transaction,
      });

      const existingAdmin = await HrisUser.findOne({
        where: { role_id: superAdminRole.id, is_active: true },
        transaction,
      });

      if (existingAdmin) {
        await transaction.rollback();
        return res.status(403).json({
          success: false,
          message: "Initial setup already completed",
        });
      }

      // Soft-deleted employees still hold their email / employee_code.
      const existingEmployee = await Employee.findOne({
        where: { email: admin.email },
        paranoid: false,
        transaction,
      });

      if (existingEmployee) {
        await transaction.rollback();
        return res.status(409).json({
          success: false,
          message: "Email already exists",
        });
      }

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

      const employeeCount = await Employee.count({
        paranoid: false,
        transaction,
      });
      const employeeCode = `EMP-${String(employeeCount + 1).padStart(4, "0")}`;

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

      await HrisUser.create(
        {
          employee_id: employee.id,
          role_id: superAdminRole.id,
          is_active: true,
          granted_at: new Date(),
        },
        { transaction },
      );

      const companyProfile = await CompanyProfile.create(
        {
          company_name: company.companyName,
          industry: company.industry,
          company_size: company.size,
        },
        { transaction },
      );

      await transaction.commit();

      // Explicit fields only — returning the model would include password_hash.
      return res.status(201).json({
        success: true,
        message: "Initial setup completed successfully",
        data: {
          employee: {
            id: employee.id,
            employee_code: employee.employee_code,
            first_name: employee.first_name,
            last_name: employee.last_name,
            email: employee.email,
            role_title: employee.role_title,
          },
          role: {
            id: superAdminRole.id,
            name: superAdminRole.name,
            code: superAdminRole.code,
          },
          company: {
            id: companyProfile.id,
            company_name: companyProfile.company_name,
            industry: companyProfile.industry,
            company_size: companyProfile.company_size,
          },
        },
      });
    } catch (err) {
      if (!transaction.finished) await transaction.rollback();
      throw err;
    }
  } catch (err) {
    console.error("Setup error:", err);

    if (err.name === "SequelizeUniqueConstraintError") {
      return res.status(409).json({
        success: false,
        message: "Email already exists",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Initial setup failed",
    });
  }
};
