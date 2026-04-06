"use strict";

const { DataTypes } = require("sequelize");
const { sequelize } = require("../../config/database");

const PayrollAdjustment = sequelize.define(
  "PayrollAdjustment",
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

    payroll_cutoff_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },

    type: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    amount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
    },

    reason: {
      type: DataTypes.STRING,
    },
  },
  {
    tableName: "payroll_adjustments",
    timestamps: true,
  },
);

module.exports = PayrollAdjustment;
