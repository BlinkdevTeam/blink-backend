"use strict";

const { QueryTypes } = require("sequelize");
const { sequelize } = require("../../../config/database");
const Employee = require("../../../models/hris/models/core/employee");
const Role = require("../../../models/hris/models/core/role");
const config = require("../../../config");

// Columns from `employees` we're willing to expose/select.
// (Excludes password_hash and any other sensitive/internal columns.)
const EMPLOYEE_COLUMNS = `
  e.id, e.employee_code, e.first_name, e.last_name, e.middle_name,
  e.email, e.personal_email, e.phone, e.avatar_initials,
  e.department_id, e.role_id, e.role_title, e.employment_type,
  e.status, e.hire_date, e.end_date, e.last_login_at, e.is_active,
  e.must_change_password, e.manager_id, e.address, e.schedule,
  e.created_at, e.updated_at, e.deleted_at
`;

// Fields a client is allowed to set/update directly on an employee.
// Anything else (is_active, must_change_password, password_hash,
// role_id, employee_code, timestamps, etc.) must go through a
// dedicated, authorized flow instead of open mass assignment.
const ALLOWED_EMPLOYEE_FIELDS = [
  "first_name",
  "last_name",
  "middle_name",
  "email",
  "personal_email",
  "phone",
  "department_id",
  "role_title",
  "employment_type",
  "status",
  "hire_date",
  "end_date",
  "manager_id",
  "address",
  "schedule",
];

function pickAllowed(body) {
  const out = {};
  for (const key of ALLOWED_EMPLOYEE_FIELDS) {
    if (body[key] !== undefined) out[key] = body[key];
  }
  return out;
}

function errMessage(err) {
  return config.env === "production" ? undefined : err.message;
}

// ────────────────────────────────
// GET ALL EMPLOYEES
// ────────────────────────────────
// employeeController.js
exports.getAllEmployees = async (req, res) => {
  try {
    const employees = await sequelize.query(
      `SELECT
         ${EMPLOYEE_COLUMNS},
         COALESCE(hu.role_id, e.role_id) AS effective_role_id,
         r.name                          AS role_name
       FROM employees e
       LEFT JOIN hris_users hu
         ON hu.employee_id = e.id AND hu.is_active = true
       LEFT JOIN roles r
         ON r.id = COALESCE(hu.role_id, e.role_id)
       WHERE e.deleted_at IS NULL`,
      { type: QueryTypes.SELECT },
    );
    return res.json(employees);
  } catch (err) {
    console.error("Error fetching employees:", err);
    return res.status(500).json({
      message: "Failed to fetch employees",
    });
  }
};

// ────────────────────────────────
// GET EMPLOYEE BY ID
// ────────────────────────────────
exports.getEmployeeById = async (req, res) => {
  try {
    const [employee] = await sequelize.query(
      `SELECT
         ${EMPLOYEE_COLUMNS},
         COALESCE(hu.role_id, e.role_id) AS role_id,
         r.name                          AS role_name,
         r.code                          AS role_code
       FROM employees e
       LEFT JOIN hris_users hu
         ON hu.employee_id = e.id AND hu.is_active = true
       LEFT JOIN roles r
         ON r.id = COALESCE(hu.role_id, e.role_id)
       WHERE e.id = :id
         AND e.deleted_at IS NULL`,
      {
        replacements: { id: req.params.id },
        type: QueryTypes.SELECT,
      },
    );

    if (!employee) {
      return res.status(404).json({ error: "Employee not found" });
    }

    return res.json(employee);
  } catch (err) {
    console.error("[getEmployeeById] Error:", err.message);
    return res
      .status(500)
      .json({ error: errMessage(err) || "Failed to fetch employee" });
  }
};

// ────────────────────────────────
// CREATE EMPLOYEE
// ────────────────────────────────
exports.createEmployee = async (req, res) => {
  try {
    const { role } = req.body;
    const fields = pickAllowed(req.body);
    let role_id = null;

    if (role) {
      const roleData = await Role.findOne({ where: { code: role } });
      if (!roleData) {
        return res.status(400).json({ error: "Invalid role provided" });
      }
      role_id = roleData.id;
      fields.role_title = roleData.name;
    }

    if (!fields.first_name || !fields.last_name || !fields.email) {
      return res.status(400).json({
        error: "first_name, last_name, and email are required",
      });
    }

    const employeeCount = await Employee.count();
    const employee = await Employee.create({
      ...fields,
      role_id,
      employee_code: `EMP-${String(employeeCount + 1).padStart(4, "0")}`,
      employment_type: fields.employment_type || "full_time",
      hire_date: fields.hire_date || new Date(),
      is_active: true,
      must_change_password: true,
    });

    return res.status(201).json(employee);
  } catch (err) {
    console.error(err);
    return res
      .status(500)
      .json({ error: errMessage(err) || "Failed to create employee" });
  }
};

// ────────────────────────────────
// UPDATE EMPLOYEE
// ────────────────────────────────
exports.updateEmployee = async (req, res) => {
  try {
    const employee = await Employee.findByPk(req.params.id);
    if (!employee) {
      return res.status(404).json({ error: "Employee not found" });
    }

    const { role } = req.body;
    const fields = pickAllowed(req.body);
    let role_id = employee.role_id;

    if (role) {
      const roleData = await Role.findOne({ where: { code: role } });
      if (!roleData) {
        return res.status(400).json({ error: "Invalid role provided" });
      }
      role_id = roleData.id;
      fields.role_title = roleData.name;
    }

    await employee.update({ ...fields, role_id });
    return res.json(employee);
  } catch (err) {
    console.error(err);
    return res
      .status(500)
      .json({ error: errMessage(err) || "Failed to update employee" });
  }
};

// ────────────────────────────────
// DELETE EMPLOYEE
// ────────────────────────────────
exports.deleteEmployee = async (req, res) => {
  try {
    const employee = await Employee.findByPk(req.params.id);
    if (!employee) {
      return res.status(404).json({ error: "Employee not found" });
    }
    await employee.destroy();
    return res.json({ message: "Employee deleted" });
  } catch (err) {
    console.error(err);
    return res
      .status(500)
      .json({ error: errMessage(err) || "Failed to delete employee" });
  }
};

// ────────────────────────────────
// COUNT
// ────────────────────────────────
exports.getEmployeeCount = async (req, res) => {
  try {
    const count = await Employee.count();
    return res.json({ count });
  } catch (err) {
    console.error(err);
    return res
      .status(500)
      .json({ error: errMessage(err) || "Failed to fetch employee count" });
  }
};
