"use strict";

const express = require("express");

const router = express.Router();

const { getAllPermissions } = require("../controllers/permissionController");

// GET ALL PERMISSIONS
router.get("/", getAllPermissions);

module.exports = router;
