// backend/routes/employees.js
const express = require("express");
const router = express.Router();
const Employee = require("../models/core/employee");

// POST /api/employees
router.post("/", async (req, res) => {
  try {
    const employee = await Employee.create(req.body);
    res.status(201).json(employee);
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
