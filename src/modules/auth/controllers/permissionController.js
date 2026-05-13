"use strict";

const { Permission } = require("../../../models");

exports.getAllPermissions = async (req, res) => {
  try {
    const permissions = await Permission.findAll({
      order: [
        ["module", "ASC"],
        ["code", "ASC"],
      ],
    });

    return res.json({
      success: true,
      data: permissions,
    });
  } catch (err) {
    console.error("Get permissions error:", err);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch permissions",
      error: err.message,
    });
  }
};
