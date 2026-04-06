const { createRoleWithPermissions } = require("../services/roleService");

exports.createRole = async (req, res) => {
  try {
    const { name } = req.body;
    const role = await createRoleWithPermissions(name);

    res.json({
      message: `Role "${name}" created with permissions`,
      role,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
