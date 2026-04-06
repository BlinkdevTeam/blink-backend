"use strict";

const { DataTypes } = require("sequelize");
const { sequelize } = require("../../config/database");

const LeaveBalance = sequelize.define(
  "LeaveBalance",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },

    employee_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },

    leave_type_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },

    year: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    allocated_days: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    used_days: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },

    remaining_days: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  },
  {
    tableName: "leave_balances",
    timestamps: true,
  },
);

module.exports = LeaveBalance;
