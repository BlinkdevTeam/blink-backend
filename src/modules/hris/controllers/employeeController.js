"use strict";

const { QueryTypes } = require("sequelize");
const { sequelize } = require("../../../config/database");
const Employee = require("../../../models/hris/models/core/employee");
const Role = require("../../../models/hris/models/core/role");

// ────────────────────────────────
// GET ALL EMPLOYEES
// ────────────────────────────────
exports.getAllEmployees = async (req, res) => {
  try {
    const employees = await sequelize.query(
      `SELECT
         e.*,
         COALESCE(hu.role_id, e.role_id) AS role_id,
         r.name                          AS role_title
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
    console.error("[getAllEmployees] Error:", err.message);
    return res.status(500).json({ error: err.message });
  }
};

// ────────────────────────────────
// GET EMPLOYEE BY ID
// ────────────────────────────────
exports.getEmployeeById = async (req, res) => {
  try {
    const [employee] = await sequelize.query(
      `SELECT
         e.*,
         COALESCE(hu.role_id, e.role_id) AS role_id,
         r.name                          AS role_title
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
    return res.status(500).json({ error: err.message });
  }
};

// ────────────────────────────────
// CREATE EMPLOYEE
// ────────────────────────────────
exports.createEmployee = async (req, res) => {
  try {
    const { role, ...rest } = req.body;
    let role_id = null;

    if (role) {
      const roleData = await Role.findOne({ where: { code: role } });
      if (!roleData) {
        return res.status(400).json({ error: "Invalid role provided" });
      }
      role_id = roleData.id;
    }

    const employee = await Employee.create({ ...rest, role_id });
    return res.status(201).json(employee);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to create employee" });
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

    const { role, ...rest } = req.body;
    let role_id = employee.role_id;

    if (role) {
      const roleData = await Role.findOne({ where: { code: role } });
      if (!roleData) {
        return res.status(400).json({ error: "Invalid role provided" });
      }
      role_id = roleData.id;
    }

    await employee.update({ ...rest, role_id });
    return res.json(employee);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to update employee" });
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
    return res.status(500).json({ error: "Failed to delete employee" });
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
    return res.status(500).json({ error: "Failed to fetch employee count" });
  }
};
