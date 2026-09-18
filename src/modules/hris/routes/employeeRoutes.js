"use strict";

const express = require("express");
const router = express.Router();

const EmployeeController = require("../controllers/employeeController");
const userPermissionController = require("../controllers/userPermissionController");

// ────────────────────────────────
// EMPLOYEE STATS / SPECIAL ROUTES
// ────────────────────────────────
router.get("/count", EmployeeController.getEmployeeCount);

// ────────────────────────────────
// EMPLOYEE CRUD
// ────────────────────────────────
router.post("/", EmployeeController.createEmployee);

router.get("/", EmployeeController.getAllEmployees);

// IMPORTANT: more specific routes FIRST
router.get("/:id/permissions", userPermissionController.getUserPermissions);

router.put("/:id/permissions", userPermissionController.updateUserPermissions);

// IMPORTANT: keep AFTER /count and other fixed routes
router.get("/:id", EmployeeController.getEmployeeById);

router.put("/:id", EmployeeController.updateEmployee);

router.delete("/:id", EmployeeController.deleteEmployee);

module.exports = router;
