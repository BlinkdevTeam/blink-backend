"use strict";

const { sequelize } = require("../config/database");

const Employee     = require("./core/employee");
const RefreshToken = require("./core/refreshTokens");

module.exports = {
  sequelize,
  Employee,
  RefreshToken,
};