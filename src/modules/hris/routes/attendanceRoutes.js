// src/modules/hris/routes/attendanceRoutes.js
"use strict";

const express = require("express");
const router = express.Router();

const requireSuperAdmin = require("../../../middleware/auth/middleware/roleMiddleware");
const attendanceCtrl = require("../controllers/attendanceController");

// Note: /api/attendance is already mounted behind `protect` in server.js,
// so every route below already requires a valid access token.

// ── READ ──
router.get("/", attendanceCtrl.getAllRecords);
router.get(
  "/employee/:employeeId/:date",
  attendanceCtrl.getRecordByEmployeeAndDate,
);

// ── CLOCK IN/OUT (any authenticated user, presumably self-service) ──
router.post("/clock-in", attendanceCtrl.clockIn);
router.put("/:id/break-start", attendanceCtrl.startBreak);
router.put("/:id/break-end", attendanceCtrl.endBreak);
router.put("/:id/clock-out", attendanceCtrl.clockOut);

// ── HR CORRECTIONS / DELETE — Super Admin only ──
router.put("/:id/correct", requireSuperAdmin, attendanceCtrl.correctRecord);
router.delete("/:id", requireSuperAdmin, attendanceCtrl.deleteRecord);

module.exports = router;
