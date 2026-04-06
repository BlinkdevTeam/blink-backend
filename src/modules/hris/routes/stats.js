const express = require("express");
const router = express.Router();
const { sequelize } = require("../config/database");

// Total employees
router.get("/employees/count", async (req, res) => {
  try {
    const [result] = await sequelize.query(
      "SELECT COUNT(*) AS count FROM employees",
    );

    res.json({ count: Number(result[0].count) });
  } catch (err) {
    console.error("Employees count error:", err.message);
    res.status(500).json({ count: 0 });
  }
});

// Total job openings
router.get("/job_openings/count", async (req, res) => {
  try {
    const [result] = await sequelize.query(
      "SELECT COUNT(*) AS count FROM job_openings",
    );

    res.json({ count: Number(result[0].count) });
  } catch (err) {
    console.error("Job openings count error:", err.message);
    res.status(500).json({ count: 0 });
  }
});

// Today's attendance
router.get("/attendance/today/count", async (req, res) => {
  try {
    const [result] = await sequelize.query(
      "SELECT COUNT(*) AS count FROM attendance_records",
    );

    res.json({ count: Number(result[0].count) });
  } catch (err) {
    console.error("Attendance count error:", err.message);
    res.status(500).json({ count: 0 });
  }
});

module.exports = router;
