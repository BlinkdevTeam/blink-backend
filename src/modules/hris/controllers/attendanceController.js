// src/modules/hris/controllers/attendanceController.js
"use strict";

const { AttendanceRecord, Employee } = require("../../../models");
const config = require("../../../config");

function errMessage(err) {
  return config.env === "production" ? undefined : err.message;
}

// ────────────────────────────────
// GET ALL ATTENDANCE RECORDS
// Supports optional ?date=YYYY-MM-DD and ?employee_id=uuid filters
// ────────────────────────────────
exports.getAllRecords = async (req, res, next) => {
  try {
    const { date, employee_id } = req.query;
    const where = {};
    if (date) where.date = date;
    if (employee_id) where.employee_id = employee_id;

    const records = await AttendanceRecord.findAll({
      where,
      include: [
        {
          model: Employee,
          attributes: ["id", "first_name", "last_name", "avatar_initials"],
        },
      ],
      order: [["date", "DESC"]],
    });

    return res.json({ success: true, count: records.length, data: records });
  } catch (err) {
    console.error("[getAllRecords] Error:", err.message);
    next(err);
  }
};

// ────────────────────────────────
// GET SINGLE EMPLOYEE'S RECORD FOR A SPECIFIC DATE
// ────────────────────────────────
exports.getRecordByEmployeeAndDate = async (req, res, next) => {
  try {
    const { employeeId, date } = req.params;

    const record = await AttendanceRecord.findOne({
      where: { employee_id: employeeId, date },
    });

    if (!record) {
      return res
        .status(404)
        .json({ success: false, message: "No attendance record found" });
    }

    return res.json({ success: true, data: record });
  } catch (err) {
    console.error("[getRecordByEmployeeAndDate] Error:", err.message);
    next(err);
  }
};

// ────────────────────────────────
// CLOCK IN
// Creates today's record for an employee (or errors if it already exists)
// ────────────────────────────────
exports.clockIn = async (req, res, next) => {
  try {
    const { employee_id, status, time_in } = req.body;

    if (!employee_id) {
      return res
        .status(400)
        .json({ success: false, message: "employee_id is required" });
    }

    const today = new Date().toISOString().split("T")[0];

    const existing = await AttendanceRecord.findOne({
      where: { employee_id, date: today },
    });

    if (existing) {
      return res.status(409).json({
        success: false,
        message: "Attendance record already exists for today",
        data: existing,
      });
    }

    const record = await AttendanceRecord.create({
      employee_id,
      date: today,
      status: status || "present",
      time_in: time_in || new Date().toTimeString().slice(0, 8),
    });

    return res.status(201).json({ success: true, data: record });
  } catch (err) {
    console.error("[clockIn] Error:", err.message);
    next(err);
  }
};

// ────────────────────────────────
// START BREAK
// ────────────────────────────────
exports.startBreak = async (req, res, next) => {
  try {
    const { id } = req.params;

    const record = await AttendanceRecord.findByPk(id);
    if (!record) {
      return res
        .status(404)
        .json({ success: false, message: "Attendance record not found" });
    }

    await record.update({
      break_out: req.body.break_out || new Date().toTimeString().slice(0, 8),
    });

    // net_hours / break_duration_mins recomputed automatically via model hook
    return res.json({ success: true, data: record });
  } catch (err) {
    console.error("[startBreak] Error:", err.message);
    next(err);
  }
};

// ────────────────────────────────
// END BREAK
// ────────────────────────────────
exports.endBreak = async (req, res, next) => {
  try {
    const { id } = req.params;

    const record = await AttendanceRecord.findByPk(id);
    if (!record) {
      return res
        .status(404)
        .json({ success: false, message: "Attendance record not found" });
    }

    await record.update({
      break_in: req.body.break_in || new Date().toTimeString().slice(0, 8),
    });

    return res.json({ success: true, data: record });
  } catch (err) {
    console.error("[endBreak] Error:", err.message);
    next(err);
  }
};

// ────────────────────────────────
// CLOCK OUT
// ────────────────────────────────
exports.clockOut = async (req, res, next) => {
  try {
    const { id } = req.params;

    const record = await AttendanceRecord.findByPk(id);
    if (!record) {
      return res
        .status(404)
        .json({ success: false, message: "Attendance record not found" });
    }

    await record.update({
      time_out: req.body.time_out || new Date().toTimeString().slice(0, 8),
    });

    // net_hours computed automatically via model hook on save
    return res.json({ success: true, data: record });
  } catch (err) {
    console.error("[clockOut] Error:", err.message);
    next(err);
  }
};

// ────────────────────────────────
// HR CORRECTION
// Allows HR to overwrite any field on an existing record
// (status, time_in, break_out, break_in, time_out)
// ────────────────────────────────
const CORRECTABLE_FIELDS = [
  "status",
  "time_in",
  "break_out",
  "break_in",
  "time_out",
];

function pickCorrectable(body) {
  const out = {};
  for (const key of CORRECTABLE_FIELDS) {
    if (body[key] !== undefined) out[key] = body[key];
  }
  return out;
}

exports.correctRecord = async (req, res, next) => {
  try {
    const { id } = req.params;

    const record = await AttendanceRecord.findByPk(id);
    if (!record) {
      return res
        .status(404)
        .json({ success: false, message: "Attendance record not found" });
    }

    const updates = pickCorrectable(req.body);

    if (Object.keys(updates).length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "No valid fields to update" });
    }

    await record.update(updates);

    // break_duration_mins / net_hours recomputed automatically via model hook
    return res.json({ success: true, data: record });
  } catch (err) {
    console.error("[correctRecord] Error:", err.message);
    next(err);
  }
};

// ────────────────────────────────
// DELETE RECORD
// ────────────────────────────────
exports.deleteRecord = async (req, res, next) => {
  try {
    const { id } = req.params;

    const record = await AttendanceRecord.findByPk(id);
    if (!record) {
      return res
        .status(404)
        .json({ success: false, message: "Attendance record not found" });
    }

    await record.destroy();
    return res.json({ success: true, message: "Record deleted" });
  } catch (err) {
    console.error("[deleteRecord] Error:", err.message);
    next(err);
  }
};
