"use strict";

const crypto = require("crypto");
const User = require("../models/core/user");
const { sendInviteEmail } = require("../utils/sendInviteEmail");

// GET ALL USERS
exports.getAll = async (_req, res, next) => {
  try {
    const users = await User.findAll();

    res.json({
      success: true,
      count: users.length,
      data: users,
    });
  } catch (err) {
    next(err);
  }
};

// GET USER BY ID
exports.getById = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.json({
      success: true,
      data: user,
    });
  } catch (err) {
    next(err);
  }
};

// CREATE USER
exports.create = async (req, res, next) => {
  try {
    const { employee_id, email, password_hash, role } = req.body;

    const user = await User.create({
      employee_id,
      email,
      password_hash,
      role,
    });

    res.status(201).json({
      success: true,
      message: "User created successfully",
      data: user,
    });
  } catch (err) {
    next(err);
  }
};

// CHECK IF USER IS SUPER ADMIN
exports.checkSuperAdmin = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (user.role !== "super_admin") {
      return res.status(403).json({
        success: false,
        message: "User is not super admin",
      });
    }

    res.json({
      success: true,
      message: "User is super admin",
      data: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    next(err);
  }
};

// INVITE USER
exports.invite = async (req, res, next) => {
  try {
    const { employee_id, email, name, role } = req.body;

    if (!employee_id || !email || !name) {
      return res.status(400).json({
        success: false,
        message: "employee_id, email, and name are required",
      });
    }

    // Generate a temporary password and invite token
    const temporaryPassword = crypto.randomBytes(6).toString("base64url");
    const inviteToken        = crypto.randomBytes(32).toString("hex");
    const inviteLink         = `${process.env.APP_BASE_URL}/accept-invite?token=${inviteToken}`;

    // Create the user record
    const user = await User.create({
      employee_id,
      email,
      password_hash: temporaryPassword, // hash this with bcrypt before saving in production
      role: role || "employee",
      invite_token: inviteToken,         // store on your model if you need to verify later
    });

    // Send the invitation email
    await sendInviteEmail({
      toEmail: email,
      toName: name,
      temporaryPassword,
      inviteLink,
    });

    res.status(201).json({
      success: true,
      message: `Invitation sent to ${email}`,
      data: {
        id: user.id,
        employee_id: user.employee_id,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    next(err);
  }
};