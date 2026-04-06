const express = require("express");
const router = express.Router();
const deptCtrl = require("../controllers/departmentController");

// GET all departments
router.get("/", deptCtrl.getDepartments);

// POST new department
router.post("/", deptCtrl.createDepartment);

router.put("/:id", deptCtrl.updateDepartment);

module.exports = router;
