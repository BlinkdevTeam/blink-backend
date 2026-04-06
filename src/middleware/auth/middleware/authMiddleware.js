"use strict";

const jwt = require("jsonwebtoken");
const { Employee, HrisUser } = require("../models");

const ACCESS_SECRET = process.env.ACCESS_SECRET || "access-secret";

async function protect(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) return res.sendStatus(401);

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, ACCESS_SECRET);

    // Attach employee info to request
    const employee = await Employee.findByPk(decoded.id);
    if (!employee) return res.sendStatus(401);

    const hrisUser = await HrisUser.findOne({
      where: { employee_id: employee.id, is_active: true },
    });

    if (!hrisUser) return res.sendStatus(403);

    req.user = {
      id: employee.id,
      role: hrisUser.role,
      email: employee.email,
    };

    next();
  } catch (err) {
    console.error("Auth middleware error:", err);
    return res.sendStatus(401);
  }
}

module.exports = { protect };
