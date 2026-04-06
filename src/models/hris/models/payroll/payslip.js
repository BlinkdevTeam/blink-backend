"use strict";

const { DataTypes } = require("sequelize");
const { sequelize } = require("../../config/database");

const Payslip = sequelize.define(
  "Payslip",
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

    gross_pay: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
    },

    total_deductions: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
    },

    net_pay: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
    },

    status: {
      type: DataTypes.STRING,
      defaultValue: "generated",
    },
  },
  {
    tableName: "payslips",
    timestamps: true,
  },
);

module.exports = Payslip;
