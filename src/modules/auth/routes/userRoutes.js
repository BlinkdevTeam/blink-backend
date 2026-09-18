"use strict";

const express = require("express");
const router = express.Router();

const usersController = require("../controllers/usersController");

router.get("/", usersController.getAll);

router.get("/:id", usersController.getById);

router.post("/", usersController.create);

router.get("/:id/check-super-admin", usersController.checkSuperAdmin);

// ── UPDATE USER (role + status) ────────────────────────────
router.put("/:id", usersController.updateUser);

// ── RESEND INVITE / FORCE PASSWORD RESET ───────────────────
router.post("/:id/resend-invite", usersController.resendInvite);

module.exports = router;
