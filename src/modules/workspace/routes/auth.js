"use strict";

const { Router }     = require("express");
const requireAuth    = require("../middleware/requireAuth");
const authController = require("../controllers/authController");

const router = Router();

// Public routes
router.post("/login",   authController.login);
router.post("/refresh", authController.refresh);
router.post("/logout",  authController.logout);

// Protected route — requires valid access token
router.get("/me", requireAuth, authController.me);

module.exports = router;