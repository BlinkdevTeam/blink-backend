const { Department, Employee } = require("../models");

// GET all departments with head info
exports.getDepartments = async (req, res) => {
  try {
    const depts = await Department.findAll({
      include: [
        {
          model: Employee,
          as: "head",
          attributes: ["id", "first_name", "last_name", "role_title", "status"],
        },
      ],
    });
    res.json(depts);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch departments" });
  }
};

// CREATE a new department
exports.createDepartment = async (req, res) => {
  const { name, head_id, color } = req.body;
  try {
    const dept = await Department.create({
      name,
      head_id: head_id || null,
      color,
    });
    const savedDept = await Department.findByPk(dept.id, {
      include: [
        {
          model: Employee,
          as: "head",
          attributes: ["id", "first_name", "last_name", "role_title", "status"],
        },
      ],
    });
    res.json(savedDept);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create department" });
  }
};

exports.updateDepartment = async (req, res) => {
  try {
    const { id } = req.params;
    const { head_id } = req.body;

    const dept = await Department.findByPk(id);

    if (!dept) {
      return res.status(404).json({ message: "Department not found" });
    }

    await dept.update({ head_id });

    res.json(dept);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to update department" });
  }
};