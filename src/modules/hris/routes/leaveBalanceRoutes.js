"use strict";

const express = require("express");
const router = express.Router();

const {
  requireRole,
} = require("../../../middleware/auth/middleware/roleMiddleware");
const controller = require("../controllers/leaveBalanceController");

// /api/leave-balances is mounted behind `protect` in server.js.
const canManageLeave = requireRole("super_admin", "hr_admin");

router.get("/", canManageLeave, controller.getLeaveBalances);
router.put("/:employeeId", canManageLeave, controller.saveLeaveBalance);

module.exports = router;
