"use strict";

const express = require("express");
const router = express.Router();

const requireSuperAdmin = require("../../../middleware/auth/middleware/roleMiddleware");
const EmployeeController = require("../controllers/employeeController");
const userPermissionController = require("../controllers/userPermissionController");

// Note: /api/employees is already mounted behind `protect` in server.js,
// so every route below already requires a valid access token.
// Sensitive writes (create/update/delete/permissions) are further
// restricted to Super Admin.

// ────────────────────────────────
// EMPLOYEE STATS / SPECIAL ROUTES
// ────────────────────────────────
router.get("/count", EmployeeController.getEmployeeCount);

// ────────────────────────────────
// EMPLOYEE CRUD
// ────────────────────────────────
router.post("/", requireSuperAdmin, EmployeeController.createEmployee);

router.get("/", EmployeeController.getAllEmployees);

// IMPORTANT: more specific routes FIRST
router.get(
  "/:id/permissions",
  requireSuperAdmin,
  userPermissionController.getUserPermissions,
);

router.put(
  "/:id/permissions",
  requireSuperAdmin,
  userPermissionController.updateUserPermissions,
);

// IMPORTANT: keep AFTER /count and other fixed routes
router.get("/:id", EmployeeController.getEmployeeById);

router.put("/:id", requireSuperAdmin, EmployeeController.updateEmployee);

router.delete("/:id", requireSuperAdmin, EmployeeController.deleteEmployee);

module.exports = router;
