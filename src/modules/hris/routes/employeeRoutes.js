"use strict";

const express = require("express");
const router = express.Router();

const EmployeeController = require("../controllers/employeeController");

const userPermissionController = require("../controllers/userPermissionController");

// ─────────────────────────────────────────
// EMPLOYEE CRUD
// ─────────────────────────────────────────
router.post("/", EmployeeController.createEmployee);

router.get("/", EmployeeController.getAllEmployees);

router.get("/:id", EmployeeController.getEmployeeById);

router.put("/:id", EmployeeController.updateEmployee);

router.delete("/:id", EmployeeController.deleteEmployee);

// ─────────────────────────────────────────
// USER PERMISSIONS
// GET /api/employees/:id/permissions
// ─────────────────────────────────────────
router.get("/:id/permissions", userPermissionController.getUserPermissions);

module.exports = router;
