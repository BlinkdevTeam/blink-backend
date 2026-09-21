"use strict";

const express = require("express");
const router = express.Router();

const requireSuperAdmin = require("../../../middleware/auth/middleware/roleMiddleware");
const deptCtrl = require("../controllers/departmentController");

// Note: /api/departments is already mounted behind `protect` in server.js,
// so every route below already requires a valid access token.
// Writes are further restricted to Super Admin.

// GET all departments
router.get("/", deptCtrl.getDepartments);

// POST new department — Super Admin only
router.post("/", requireSuperAdmin, deptCtrl.createDepartment);

// PUT update department — Super Admin only
router.put("/:id", requireSuperAdmin, deptCtrl.updateDepartment);

module.exports = router;
