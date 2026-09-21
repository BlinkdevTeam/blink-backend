"use strict";

const crypto = require("crypto");
const bcrypt = require("bcrypt");

const {
  HrisUser,
  Role,
  Employee,
  PasswordResetToken,
} = require("../../../models");
const { sequelize } = require("../../../config/database");
const {
  sendInviteEmail,
} = require("../../../utils/auth/utils/sendInviteEmail");

// Fields that must never leave this controller in a response.
// (Covers both the current schema and legacy columns some records may still have.)
const SENSITIVE_ATTRS = ["password_hash", "invite_token"];

function safeAttributes(model) {
  return { exclude: SENSITIVE_ATTRS };
}

function hashToken(rawToken) {
  return crypto.createHash("sha256").update(rawToken).digest("hex");
}

// ────────────────────────────────
// GET ALL USERS
// ────────────────────────────────
exports.getAll = async (_req, res, next) => {
  try {
    const users = await HrisUser.findAll({
      attributes: safeAttributes(HrisUser),
    });
    res.json({ success: true, count: users.length, data: users });
  } catch (err) {
    next(err);
  }
};

// ────────────────────────────────
// GET USER BY ID
// ────────────────────────────────
exports.getById = async (req, res, next) => {
  try {
    const user = await HrisUser.findByPk(req.params.id, {
      attributes: safeAttributes(HrisUser),
    });
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }
    res.json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
};

// ────────────────────────────────
// CREATE USER
// ────────────────────────────────
exports.create = async (req, res, next) => {
  try {
    // Whitelist — never trust the client for role/active/timestamps.
    const { employee_id, role_id } = req.body;

    if (!employee_id) {
      return res.status(400).json({
        success: false,
        message: "employee_id is required",
      });
    }

    const user = await HrisUser.create({
      employee_id,
      role_id: role_id ?? null,
      is_active: true,
      granted_at: new Date(),
    });

    const { password_hash, invite_token, ...safeUser } = user.toJSON();

    res.status(201).json({
      success: true,
      message: "User created successfully",
      data: safeUser,
    });
  } catch (err) {
    next(err);
  }
};

// ────────────────────────────────
// CHECK IF USER IS SUPER ADMIN
// ────────────────────────────────
exports.checkSuperAdmin = async (req, res, next) => {
  try {
    const user = await HrisUser.findOne({
      where: { employee_id: req.params.id },
      attributes: safeAttributes(HrisUser),
      include: [
        {
          model: Role,
          attributes: ["id", "name", "code"],
          required: false,
        },
      ],
    });

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    const roleCode = user.Role?.code ?? "";

    if (roleCode !== "super_admin") {
      return res
        .status(403)
        .json({ success: false, message: "User is not super admin" });
    }

    res.json({
      success: true,
      message: "User is super admin",
      data: {
        id: user.id,
        role: roleCode,
        role_id: user.Role?.id ?? user.role_id,
      },
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/setup/check-super-admin  (no params — just checks if any exists)
exports.checkSetupComplete = async (req, res, next) => {
  try {
    const superAdminRole = await Role.findOne({
      where: { code: "super_admin" },
    });

    if (!superAdminRole) {
      return res.json({ exists: false });
    }

    const superAdminUser = await HrisUser.findOne({
      where: {
        role_id: superAdminRole.id,
        is_active: true,
      },
    });

    res.json({ exists: !!superAdminUser });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────
// SHARED HELPER — createInviteToken
//
// Generates a raw token, returns it (for the email link) plus its
// SHA-256 hash. The raw token is never persisted anywhere — only the
// hash is stored, in PasswordResetToken (type = "invite"), so
// authController.verifyResetToken and resetPassword can look it up
// the same way as the forgot-password flow.
// ─────────────────────────────────────────────────────────────
async function createInviteToken(employeeId) {
  const rawToken = crypto.randomBytes(32).toString("hex");
  const tokenHash = hashToken(rawToken);

  // Invalidate any previous unused invite tokens for this employee
  await PasswordResetToken.update(
    { used_at: new Date() },
    { where: { employee_id: employeeId, type: "invite", used_at: null } },
  );

  // No expiry on invite tokens — they're invalidated on use (used_at set)
  await PasswordResetToken.create({
    employee_id: employeeId,
    token_hash: tokenHash,
    type: "invite",
    expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
  });

  return rawToken;
}

// ────────────────────────────────
// INVITE USER
// POST /api/users/invite
//
// No temporary password — the user sets their own password
// by clicking the link in the email.
// ────────────────────────────────
exports.invite = async (req, res, next) => {
  try {
    const { employee_id, email, name, role_id } = req.body;

    if (!employee_id || !email || !name) {
      return res.status(400).json({
        success: false,
        message: "employee_id, email, and name are required",
      });
    }

    const rawToken = await createInviteToken(employee_id);
    const inviteLink = `${process.env.APP_BASE_URL}/login?token=${rawToken}`;

    // Only the hash lives in PasswordResetToken (createInviteToken above).
    // HrisUser itself never stores the raw or hashed token.
    const user = await HrisUser.create({
      employee_id,
      role_id: role_id ?? null,
      is_active: true,
      must_change_password: true,
      granted_at: new Date(),
    });

    await sendInviteEmail({ toEmail: email, toName: name, inviteLink });

    const { password_hash, invite_token, ...safeUser } = user.toJSON();

    res.status(201).json({
      success: true,
      message: `Invitation sent to ${email}`,
      data: safeUser,
    });
  } catch (err) {
    next(err);
  }
};

// ────────────────────────────────
// RESEND INVITE / FORCE PASSWORD RESET
// POST /api/users/:id/resend-invite
// ────────────────────────────────
exports.resendInvite = async (req, res, next) => {
  try {
    const { id } = req.params; // employee_id (UUID)

    const hrisUser = await HrisUser.findOne({ where: { employee_id: id } });
    if (!hrisUser) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    const employee = await Employee.findByPk(id);
    if (!employee) {
      return res
        .status(404)
        .json({ success: false, message: "Employee not found" });
    }

    const rawToken = await createInviteToken(id);
    const inviteLink = `${process.env.APP_BASE_URL}/login?token=${rawToken}`;

    // Rotate: clear password so they must set a new one. The token itself
    // only ever lives (hashed) in PasswordResetToken.
    await hrisUser.update({
      password_hash: null,
      must_change_password: true,
    });

    await Employee.update({ must_change_password: true }, { where: { id } });

    const fullName = `${employee.first_name} ${employee.last_name}`;
    await sendInviteEmail({
      toEmail: employee.email,
      toName: fullName,
      inviteLink,
    });

    return res.json({
      success: true,
      message: `Invite resent to ${employee.email}`,
    });
  } catch (err) {
    next(err);
  }
};

// ────────────────────────────────
// UPDATE USER — role + status
// PUT /api/users/:id
// ────────────────────────────────
exports.updateUser = async (req, res, next) => {
  const transaction = await sequelize.transaction();

  try {
    const { id } = req.params;

    // ── Accept role_id (UUID) primarily, fall back to role_code string ──
    const role_id = req.body.role_id ?? undefined;
    const role_code = req.body.role_code ?? req.body.role ?? undefined;
    const rawStatus = req.body.status;
    const rawActive = req.body.is_active;

    let is_active;
    if (rawActive !== undefined) {
      is_active = Boolean(rawActive);
    } else if (rawStatus !== undefined) {
      is_active = rawStatus === "active";
    }

    let employeeStatus;
    if (rawStatus !== undefined) {
      employeeStatus = rawStatus;
    } else if (rawActive !== undefined) {
      employeeStatus = Boolean(rawActive) ? "active" : "inactive";
    }

    // ── Resolve role ──────────────────────────────────────────────────────
    let resolvedRole = null;

    if (role_id) {
      resolvedRole = await Role.findByPk(role_id, { transaction });

      if (!resolvedRole) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: `Role with id "${role_id}" not found`,
        });
      }
    } else if (role_code) {
      const nameFromCode = role_code
        .split("_")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ");

      resolvedRole =
        (await Role.findOne({ where: { name: nameFromCode }, transaction })) ??
        (await Role.findOne({ where: { name: role_code }, transaction }));

      if (!resolvedRole) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: `Role "${role_code}" not found`,
        });
      }
    }

    // ── Update hris_users ─────────────────────────────────────────────────
    let hrisUser = await HrisUser.findOne({
      where: { employee_id: id },
      transaction,
    });

    if (!hrisUser) {
      hrisUser = await HrisUser.create(
        {
          employee_id: id,
          role_id: resolvedRole?.id ?? null,
          is_active: is_active !== undefined ? is_active : true,
          granted_at: new Date(),
        },
        { transaction },
      );
    } else {
      const hrisUpdates = {};
      if (resolvedRole) hrisUpdates.role_id = resolvedRole.id;
      if (is_active !== undefined) hrisUpdates.is_active = is_active;

      if (Object.keys(hrisUpdates).length > 0) {
        await hrisUser.update(hrisUpdates, { transaction });
      }
    }

    // ── Update employees table ────────────────────────────────────────────
    const employeeUpdates = {};
    if (employeeStatus !== undefined) employeeUpdates.status = employeeStatus;
    if (is_active !== undefined) employeeUpdates.is_active = is_active;
    if (resolvedRole) {
      employeeUpdates.role_id = resolvedRole.id;
      employeeUpdates.role_title = resolvedRole.name;
    }

    if (Object.keys(employeeUpdates).length > 0) {
      await Employee.update(employeeUpdates, { where: { id }, transaction });
    }

    await transaction.commit();

    return res.json({
      success: true,
      message: "User updated successfully",
      data: {
        id: hrisUser.id,
        employee_id: hrisUser.employee_id,
        role_id: resolvedRole?.id ?? hrisUser.role_id,
        role_title: resolvedRole?.name ?? null,
        is_active: hrisUser.is_active,
        status: employeeStatus,
      },
    });
  } catch (err) {
    await transaction.rollback();
    next(err);
  }
};
