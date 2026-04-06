"use strict";

const { DataTypes } = require("sequelize");
const { sequelize } = require("../../config/database");
const Employee = require("./employee"); // assuming Employee model is in the same folder

// ✅ LoginAttempt model to track failed/successful logins
const LoginAttempt = sequelize.define(
  "LoginAttempt",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },

    employee_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: Employee,
        key: "id",
      },
    },

    successful: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
    },

    ip_address: {
      type: DataTypes.STRING(45), // IPv6 compatible
      allowNull: true,
    },

    user_agent: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    attempt_time: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: "login_attempts",
    timestamps: false, // we already have attempt_time
  },
);

// ✅ Optional: association for easier queries
Employee.hasMany(LoginAttempt, { foreignKey: "employee_id" });
LoginAttempt.belongsTo(Employee, { foreignKey: "employee_id" });

module.exports = LoginAttempt;
