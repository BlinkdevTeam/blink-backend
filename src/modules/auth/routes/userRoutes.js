"use strict";

const express = require("express");
const router = express.Router();

const usersController = require("../controllers/usersController");
const {
  requireRole,
} = require("../../../middleware/auth/middleware/roleMiddleware");

// `protect` already runs at the app level (see server.js) before these routes
// are reached — req.user is guaranteed to exist here.

// Per the permission matrix: users.manage is super_admin + hr_admin.
// Role assignment itself (roles.assign) is super_admin only — enforced
// inside usersController.updateUser, since it needs to allow hr_admin
// to update status/dept without touching role_id.
const canManageUsers = requireRole("super_admin", "hr_admin");

router.get("/", canManageUsers, usersController.getAll);

router.get("/:id", canManageUsers, usersController.getById);

router.post("/", canManageUsers, usersController.create);

router.get(
  "/:id/check-super-admin",
  canManageUsers,
  usersController.checkSuperAdmin,
);

// ── UPDATE USER (role + status) ────────────────────────────
// Role-change restriction (super_admin only) enforced inside the controller.
router.put("/:id", canManageUsers, usersController.updateUser);

// ── RESEND INVITE / FORCE PASSWORD RESET ───────────────────
router.post("/:id/resend-invite", canManageUsers, usersController.resendInvite);

module.exports = router;
